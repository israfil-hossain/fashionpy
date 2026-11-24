import {
  type DeliveryPricingConfig,
  type DeliveryPricingOverride,
  type DeliveryZone,
  resolveDeliveryPricingConfig,
} from "@mercurjs/types"

export interface DeliveryChargeBreakdown {
  amount: number
  zone: DeliveryZone
  base: number
  weight_increment: number
  weight_kg: number
}

export interface DeliveryChargeInput {
  city?: string | null
  weight_kg?: number | null
  product_override?: DeliveryPricingOverride | null
  seller_override?: DeliveryPricingOverride | null
  config?: DeliveryPricingConfig
}

const DEFAULT_WEIGHT_KG = 0.5

export const resolveDeliveryZone = (
  city: string | null | undefined,
  aliases: string[] = []
): DeliveryZone => {
  if (!city || typeof city !== "string") {
    return "outside_dhaka"
  }

  const normalized = city.trim().toLowerCase()
  if (!normalized) {
    return "outside_dhaka"
  }

  const segments = normalized.split(/[,\s]+/).filter(Boolean)

  return aliases.some((alias) => {
    const value = alias.trim().toLowerCase()
    if (!value) {
      return false
    }
    const words = value.split(/[,\s]+/).filter(Boolean)
    return (
      normalized === value ||
      words.every((word) => segments.includes(word))
    )
  })
    ? "dhaka"
    : "outside_dhaka"
}

export const calculateWeightIncrement = (
  weightKg: number | null | undefined,
  config: DeliveryPricingConfig
): number => {
  const weight =
    typeof weightKg === "number" && Number.isFinite(weightKg) && weightKg > 0
      ? weightKg
      : DEFAULT_WEIGHT_KG

  const bands = [...config.weight_bands].sort(
    (a, b) => a.up_to_kg - b.up_to_kg
  )

  for (const band of bands) {
    if (weight <= band.up_to_kg) {
      return band.increment
    }
  }

  const lastBand = bands[bands.length - 1]
  const lastLimit = lastBand?.up_to_kg ?? 2
  const lastIncrement = lastBand?.increment ?? 30
  const extraKg = Math.max(0, Math.ceil(weight - lastLimit))

  return lastIncrement + extraKg * config.extra_kg_increment
}

export const resolveDeliveryBase = (
  zone: DeliveryZone,
  config: DeliveryPricingConfig,
  productOverride?: DeliveryPricingOverride | null,
  sellerOverride?: DeliveryPricingOverride | null
): number => {
  const key = zone === "dhaka" ? "dhaka_base" : "outside_dhaka_base"
  return productOverride?.[key] ?? sellerOverride?.[key] ?? config[key]
}

export const calculateDeliveryCharge = (
  input: DeliveryChargeInput
): DeliveryChargeBreakdown => {
  const config = input.config ?? resolveDeliveryPricingConfig(null)
  const weightKg =
    typeof input.weight_kg === "number" &&
    Number.isFinite(input.weight_kg) &&
    input.weight_kg > 0
      ? input.weight_kg
      : DEFAULT_WEIGHT_KG
  const zone = resolveDeliveryZone(input.city, config.dhaka_city_aliases)
  const base = resolveDeliveryBase(
    zone,
    config,
    input.product_override,
    input.seller_override
  )
  const weightIncrement = calculateWeightIncrement(weightKg, config)

  return {
    amount: base + weightIncrement,
    zone,
    base,
    weight_increment: weightIncrement,
    weight_kg: weightKg,
  }
}
