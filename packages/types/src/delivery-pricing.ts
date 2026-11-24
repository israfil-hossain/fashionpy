/**
 * Bangladesh delivery pricing contract shared by the dashboards, the pricing
 * resolver and the cart workflows. Platform defaults live in the Medusa
 * store's metadata; seller/offer overrides use the same key on their metadata.
 */
export const DELIVERY_PRICING_METADATA_KEY = "delivery_pricing"

export type DeliveryZone = "dhaka" | "outside_dhaka"

export interface DeliveryWeightBand {
  up_to_kg: number
  increment: number
}

export interface DeliveryPricingConfig {
  dhaka_base: number
  outside_dhaka_base: number
  weight_bands: DeliveryWeightBand[]
  extra_kg_increment: number
  warehouse_fee: number
  platform_warehouse_location_id?: string | null
  dhaka_city_aliases: string[]
}

export interface DeliveryPricingOverride {
  dhaka_base?: number
  outside_dhaka_base?: number
}

export const DEFAULT_DELIVERY_PRICING: DeliveryPricingConfig = {
  dhaka_base: 60,
  outside_dhaka_base: 120,
  weight_bands: [
    { up_to_kg: 0.5, increment: 0 },
    { up_to_kg: 1, increment: 10 },
    { up_to_kg: 2, increment: 30 },
  ],
  extra_kg_increment: 15,
  warehouse_fee: 12,
  platform_warehouse_location_id: null,
  dhaka_city_aliases: [
    "dhaka",
    "dhaka city",
    "dhaka metro",
    "dhaka metropolitan",
    "ঢাকা",
    "ঢাকা মেট্রো",
  ],
}

const asNonNegativeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

const readBands = (value: unknown): DeliveryWeightBand[] => {
  if (!Array.isArray(value)) {
    return DEFAULT_DELIVERY_PRICING.weight_bands.map((band) => ({ ...band }))
  }

  const bands = value
    .map((band) => {
      if (!band || typeof band !== "object") {
        return null
      }
      const entry = band as Record<string, unknown>
      const upTo = asNonNegativeNumber(entry.up_to_kg)
      const increment = asNonNegativeNumber(entry.increment)
      return upTo === null || increment === null
        ? null
        : { up_to_kg: upTo, increment }
    })
    .filter((band): band is DeliveryWeightBand => band !== null)
    .sort((a, b) => a.up_to_kg - b.up_to_kg)

  return bands.length
    ? bands
    : DEFAULT_DELIVERY_PRICING.weight_bands.map((band) => ({ ...band }))
}

export const resolveDeliveryPricingConfig = (
  metadata: Record<string, unknown> | null | undefined
): DeliveryPricingConfig => {
  const raw = metadata?.[DELIVERY_PRICING_METADATA_KEY]
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_DELIVERY_PRICING,
      weight_bands: DEFAULT_DELIVERY_PRICING.weight_bands.map((band) => ({ ...band })),
      dhaka_city_aliases: [...DEFAULT_DELIVERY_PRICING.dhaka_city_aliases],
    }
  }

  const value = raw as Record<string, unknown>
  const aliases = Array.isArray(value.dhaka_city_aliases)
    ? value.dhaka_city_aliases.filter(
        (alias): alias is string => typeof alias === "string" && alias.length > 0
      )
    : []

  return {
    dhaka_base:
      asNonNegativeNumber(value.dhaka_base) ?? DEFAULT_DELIVERY_PRICING.dhaka_base,
    outside_dhaka_base:
      asNonNegativeNumber(value.outside_dhaka_base) ??
      DEFAULT_DELIVERY_PRICING.outside_dhaka_base,
    weight_bands: readBands(value.weight_bands),
    extra_kg_increment:
      asNonNegativeNumber(value.extra_kg_increment) ??
      DEFAULT_DELIVERY_PRICING.extra_kg_increment,
    warehouse_fee:
      asNonNegativeNumber(value.warehouse_fee) ??
      DEFAULT_DELIVERY_PRICING.warehouse_fee,
    platform_warehouse_location_id:
      typeof value.platform_warehouse_location_id === "string"
        ? value.platform_warehouse_location_id
        : null,
    dhaka_city_aliases: aliases.length
      ? aliases
      : [...DEFAULT_DELIVERY_PRICING.dhaka_city_aliases],
  }
}

export const readDeliveryPricingOverride = (
  metadata: Record<string, unknown> | null | undefined
): DeliveryPricingOverride | null => {
  const raw = metadata?.[DELIVERY_PRICING_METADATA_KEY]
  if (!raw || typeof raw !== "object") {
    return null
  }

  const value = raw as Record<string, unknown>
  const override: DeliveryPricingOverride = {}
  const dhakaBase = asNonNegativeNumber(value.dhaka_base)
  const outsideBase = asNonNegativeNumber(value.outside_dhaka_base)

  if (dhakaBase !== null) {
    override.dhaka_base = dhakaBase
  }
  if (outsideBase !== null) {
    override.outside_dhaka_base = outsideBase
  }

  return Object.keys(override).length ? override : null
}
