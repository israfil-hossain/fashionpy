import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import {
  parseProductCustomization,
  type CustomizationValues,
} from "@mercurjs/types"
import { Modules } from "@medusajs/framework/utils"
import { defaultStoreCartFields, refetchCart } from "../../helpers"
import { StoreAddCartLineItemType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreAddCartLineItemType>,
  res: MedusaResponse,
) => {
  const cart_id = req.params.id
  const { additional_data, metadata, offer_id, ...item } = req.validatedBody

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id", "variant_id", "product_id", "product.metadata"],
    filters: { id: offer_id },
  })

  const offer = offers[0] as
    | {
        id: string
        variant_id: string
        product?: { metadata?: Record<string, unknown> | null } | null
      }
    | undefined
  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer ${offer_id} not found`,
    )
  }

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id,
      items: [
        {
          ...item,
          variant_id: offer.variant_id,
          offer_id,
          requires_shipping: true,
          metadata: { ...(metadata ?? {}), offer_id },
        },
      ],
      additional_data,
    },
  })

  const customization = parseProductCustomization(
    offer.product?.metadata?.customization
  )
  const values = metadata?.customization as CustomizationValues | undefined
  const extraPrice = customization && values
    ? customization.fields.reduce((total, field) => {
        const value = values[field.key]
        return value === undefined || value === null || value === ""
          ? total
          : total + (field.extra_price ?? 0)
      }, 0)
    : 0

  if (extraPrice > 0) {
    const refreshed = await refetchCart(cart_id, req.scope, defaultStoreCartFields)
    const fingerprint = metadata?.customization_fingerprint
    const line = (refreshed.items ?? []).find(
      (item: { metadata?: Record<string, unknown> | null }) =>
        item.metadata?.offer_id === offer_id &&
        (item.metadata?.customization_fingerprint ?? null) === (fingerprint ?? null)
    ) as { id: string } | undefined

    if (line) {
      const cartService = req.scope.resolve(Modules.CART) as {
        addLineItemAdjustments: (
          adjustments: Array<{
            item_id: string
            amount: number
            description: string
          }>
        ) => Promise<unknown>
      }
      await cartService.addLineItemAdjustments([
        {
          item_id: line.id,
          amount: -extraPrice,
          description: "Customization",
        },
      ])
    }
  }

  const cart = await refetchCart(cart_id, req.scope, defaultStoreCartFields)
  res.status(200).json({ cart })
}
