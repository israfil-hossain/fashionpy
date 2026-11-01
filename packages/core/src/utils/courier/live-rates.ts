import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"
import { MercurModules } from "@mercurjs/types"

import type CourierModuleService from "../../modules/courier/services/courier-module-service"

export interface CourierOptionRate {
  option_id: string
  amount: number
  currency_code: string
  eta_description?: string
}

/**
 * Providers attempted per seller, in preference order. Steadfast quotes
 * always return null (no rate API) — Pathao wins when its city mapping
 * resolves; otherwise every entry stays null and callers keep flat prices.
 */
const RATE_PROVIDERS = ["pathao", "steadfast"]

const DEFAULT_WEIGHT_KG = 0.5

/**
 * Quote live courier rates for the given shipping options against the cart's
 * destination. Best-effort by design: any missing account, unresolvable
 * destination, or provider failure leaves the option OUT of the result so
 * callers fall back to the seller's flat price.
 */
export async function quoteCourierOptionRates(
  container: MedusaContainer,
  input: { cart_id: string; option_ids: string[] }
): Promise<CourierOptionRate[]> {
  if (!input.option_ids.length) {
    return []
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const courierService = container.resolve<CourierModuleService>(
    MercurModules.COURIER
  )

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.phone",
      "shipping_address.address_1",
      "shipping_address.city",
      "shipping_address.postal_code",
      "shipping_address.country_code",
      "items.quantity",
      "items.variant.weight",
    ],
    filters: { id: input.cart_id },
  })
  const cart = carts?.[0]
  const address = cart?.shipping_address
  if (!cart || !address?.address_1) {
    return []
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "seller.id"],
    filters: { id: input.option_ids },
  })

  const weight = (cart.items ?? []).reduce(
    (sum: number, item: any) =>
      sum + (Number(item.variant?.weight) || 0) * (item.quantity || 1),
    0
  )
  const itemCount = (cart.items ?? []).reduce(
    (sum: number, item: any) => sum + (item.quantity || 0),
    0
  )

  const recipient = {
    name: `${address.first_name ?? ""} ${address.last_name ?? ""}`.trim(),
    phone: address.phone ?? "",
    address: address.address_1,
    city: address.city ?? undefined,
    postal_code: address.postal_code ?? undefined,
    country_code: address.country_code ?? undefined,
  }

  const rates: CourierOptionRate[] = []

  for (const option of options ?? []) {
    const sellerId = option.seller?.id
    if (!sellerId) continue

    for (const provider of RATE_PROVIDERS) {
      const quote = await courierService.getRatesForSeller({
        provider,
        seller_id: sellerId,
        recipient,
        weight: weight > 0 ? weight : DEFAULT_WEIGHT_KG,
        item_count: Math.max(1, itemCount),
        cod_amount: 0,
      })

      if (quote && Number.isFinite(quote.price)) {
        rates.push({
          option_id: option.id,
          amount: quote.price,
          currency_code: quote.currency_code,
          eta_description: quote.eta_description,
        })
        break // first provider with a quote wins
      }
    }
  }

  return rates
}
