import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"
import {
  type DeliveryPricingConfig,
  readDeliveryPricingOverride,
  resolveDeliveryPricingConfig,
} from "@mercurjs/types"

import {
  calculateDeliveryCharge,
  calculateWeightIncrement,
  resolveDeliveryBase,
  resolveDeliveryZone,
  type DeliveryChargeBreakdown,
} from "./delivery-pricing"

interface CartLine {
  id: string
  quantity: number
  variant?: { weight?: number | string | null } | null
  offer?: {
    id?: string | null
    seller_id?: string | null
    inventory_items?: Array<{
      requires_shipping?: boolean
      location_levels?: Array<{
        location_id: string
        available_quantity?: number | string | null
      }>
    }>
  } | null
}

interface ShippingOptionSource {
  id: string
  seller?: { id?: string | null } | null
  service_zone?: {
    fulfillment_set?: { location?: { id?: string | null } | null } | null
  } | null
}

export interface DeliveryGroupCharge extends DeliveryChargeBreakdown {
  amount: number
}

export interface DeliverySourceGroup {
  key: string
  type: "platform_warehouse" | "seller_store"
  seller_id: string | null
  location_id: string | null
  item_ids: string[]
  option_ids: string[]
  weight_kg: number
  charge: DeliveryGroupCharge
}

export interface DeliveryQuote {
  config: DeliveryPricingConfig
  city: string | null
  groups: DeliverySourceGroup[]
  amountByOption: Record<string, number>
  carrierByGroup: Record<string, string>
}

const DEFAULT_WEIGHT_KG = 0.5

const numberValue = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const itemWeight = (item: CartLine): number => {
  const weight = numberValue(item.variant?.weight)
  return (weight && weight > 0 ? weight : DEFAULT_WEIGHT_KG) * (item.quantity || 1)
}

const shippedFrom = (
  item: CartLine,
  locationId: string | null
): boolean => {
  if (!locationId) {
    return false
  }
  const links = item.offer?.inventory_items ?? []
  return links.some((inventoryItem) => {
    if (inventoryItem.requires_shipping === false) {
      return false
    }
    const level = (inventoryItem.location_levels ?? []).find(
      (entry) => entry.location_id === locationId
    )
    if (!level) {
      return false
    }
    const available = numberValue(level.available_quantity)
    return available === null || available >= (item.quantity || 1)
  })
}

const firstStockedLocation = (item: CartLine): string | null => {
  const links = item.offer?.inventory_items ?? []
  for (const inventoryItem of links) {
    if (inventoryItem.requires_shipping === false) {
      continue
    }
    for (const level of inventoryItem.location_levels ?? []) {
      const available = numberValue(level.available_quantity)
      if (level.location_id && (available === null || available > 0)) {
        return level.location_id
      }
    }
  }
  return null
}

/**
 * Computes one delivery charge per physical shipment: warehouse-sourced items
 * share a single charge (even across sellers), while seller-store items are
 * charged per store. The returned option amounts are safe to write onto cart
 * shipping methods — the first option of each group carries the full charge.
 */
export async function quoteBangladeshDelivery(
  container: MedusaContainer,
  input: { cart_id: string; option_ids?: string[] }
): Promise<DeliveryQuote | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "currency_code",
      "shipping_address.city",
      "shipping_address.country_code",
      "items.id",
      "items.quantity",
      "items.variant.weight",
      "items.offer.id",
      "items.offer.seller_id",
      "items.offer.inventory_items.requires_shipping",
      "items.offer.inventory_items.location_levels.location_id",
      "items.offer.inventory_items.location_levels.available_quantity",
    ],
    filters: { id: input.cart_id },
  })
  const cart = carts?.[0]
  if (!cart || cart.currency_code?.toLowerCase() !== "bdt") {
    return null
  }

  const city = cart.shipping_address?.city ?? null
  if (!city) {
    return null
  }

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "default_location_id", "metadata"],
  })
  const store = stores?.[0]
  const config = resolveDeliveryPricingConfig(
    (store?.metadata ?? null) as Record<string, unknown> | null
  )

  let warehouseId: string | null = config.platform_warehouse_location_id ?? null
  if (!warehouseId && store?.default_location_id) {
    const { data: locationLinks } = await query.graph({
      entity: "stock_location_seller",
      fields: ["stock_location_id"],
      filters: { stock_location_id: store.default_location_id },
    })
    if (!locationLinks?.length) {
      warehouseId = store.default_location_id
    }
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "seller.id",
      "service_zone.fulfillment_set.location.id",
    ],
    filters: input.option_ids?.length ? { id: input.option_ids } : {},
  })

  const sellerIds = Array.from(
    new Set(
      (cart.items ?? [])
        .map((item: CartLine) => item.offer?.seller_id)
        .filter((id): id is string => typeof id === "string")
    )
  )
  const offerIds = Array.from(
    new Set(
      (cart.items ?? [])
        .map((item: CartLine) => item.offer?.id)
        .filter((id): id is string => typeof id === "string")
    )
  )

  const [sellers, offers] = await Promise.all([
    sellerIds.length
      ? query.graph({
          entity: "seller",
          fields: ["id", "metadata"],
          filters: { id: sellerIds },
        })
      : Promise.resolve({ data: [] as Array<{ id: string; metadata?: unknown }> }),
    offerIds.length
      ? query.graph({
          entity: "offer",
          fields: ["id", "metadata"],
          filters: { id: offerIds },
        })
      : Promise.resolve({ data: [] as Array<{ id: string; metadata?: unknown }> }),
  ])

  const sellerMetadata = new Map<string, Record<string, unknown> | null>(
    (sellers.data ?? []).map(
      (seller): [string, Record<string, unknown> | null] => [
        seller.id,
        (seller.metadata ?? null) as Record<string, unknown> | null,
      ]
    )
  )
  const offerMetadata = new Map<string, Record<string, unknown> | null>(
    (offers.data ?? []).map(
      (offer): [string, Record<string, unknown> | null] => [
        offer.id,
        (offer.metadata ?? null) as Record<string, unknown> | null,
      ]
    )
  )

  const grouped = new Map<
    string,
    {
      key: string
      type: "platform_warehouse" | "seller_store"
      seller_id: string | null
      location_id: string | null
      items: CartLine[]
      overrides: Array<{
        product: ReturnType<typeof readDeliveryPricingOverride>
        seller: ReturnType<typeof readDeliveryPricingOverride>
      }>
    }
  >()

  for (const item of (cart.items ?? []) as CartLine[]) {
    const inWarehouse = warehouseId ? shippedFrom(item, warehouseId) : false
    const sellerId = item.offer?.seller_id ?? null
    const locationId = inWarehouse ? warehouseId : firstStockedLocation(item)
    const key = inWarehouse
      ? "platform_warehouse"
      : `seller_store:${sellerId ?? "unknown"}:${locationId ?? "default"}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        type: inWarehouse ? "platform_warehouse" : "seller_store",
        seller_id: inWarehouse ? null : sellerId,
        location_id: locationId,
        items: [],
        overrides: [],
      })
    }
    const group = grouped.get(key)!
    group.items.push(item)
    group.overrides.push({
      product: readDeliveryPricingOverride(
        item.offer?.id ? (offerMetadata.get(item.offer.id) ?? null) : null
      ),
      seller: sellerId
        ? readDeliveryPricingOverride(sellerMetadata.get(sellerId) ?? null)
        : null,
    })
  }

  const optionSources = (options ?? []) as unknown as ShippingOptionSource[]
  const zone = resolveDeliveryZone(city, config.dhaka_city_aliases)

  const groups: DeliverySourceGroup[] = Array.from(grouped.values()).map(
    (group) => {
      const weightKg = group.items.reduce(
        (sum, item) => sum + itemWeight(item),
        0
      )
      const optionIds = optionSources
        .filter((option) => {
          const optionLocationId =
            option.service_zone?.fulfillment_set?.location?.id ?? null
          const optionSellerId = option.seller?.id ?? null
          if (group.type === "platform_warehouse") {
            return !!optionLocationId && optionLocationId === warehouseId
          }
          return (
            optionSellerId === group.seller_id &&
            (!group.location_id || optionLocationId === group.location_id)
          )
        })
        .map((option) => option.id)
        .sort()

      let charge: DeliveryGroupCharge
      if (group.type === "platform_warehouse") {
        charge = calculateDeliveryCharge({ city, weight_kg: weightKg, config })
      } else {
        const base = group.overrides.reduce(
          (highest, override) =>
            Math.max(
              highest,
              resolveDeliveryBase(
                zone,
                config,
                override.product,
                override.seller
              )
            ),
          0
        )
        const weightIncrement = calculateWeightIncrement(weightKg, config)
        charge = {
          amount: base + weightIncrement,
          zone,
          base,
          weight_increment: weightIncrement,
          weight_kg: weightKg,
        }
      }

      return {
        key: group.key,
        type: group.type,
        seller_id: group.seller_id,
        location_id: group.location_id,
        item_ids: group.items.map((item) => item.id),
        option_ids: optionIds,
        weight_kg: weightKg,
        charge,
      }
    }
  )

  const amountByOption: Record<string, number> = {}
  const carrierByGroup: Record<string, string> = {}
  for (const group of groups) {
    const carrier = group.option_ids[0]
    if (!carrier) {
      continue
    }
    carrierByGroup[group.key] = carrier
    for (const optionId of group.option_ids) {
      amountByOption[optionId] = optionId === carrier ? group.charge.amount : 0
    }
  }

  return { config, city, groups, amountByOption, carrierByGroup }
}
