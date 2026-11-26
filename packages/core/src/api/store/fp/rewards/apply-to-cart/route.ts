import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

export const POST = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Login required")
  }

  const body = (req.body ?? {}) as {
    cart_id?: string
    points_to_redeem?: number
  }
  const cartId = body.cart_id
  const points = Number(body.points_to_redeem ?? 0)
  if (!cartId || !Number.isFinite(points) || points <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Provide a cart id and a positive points amount"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "customer_id",
      "item_subtotal",
      "credit_lines.id",
      "credit_lines.amount",
      "credit_lines.metadata",
    ],
    filters: { id: cartId },
  })
  const cart = carts[0] as
    | {
        id: string
        customer_id: string | null
        item_subtotal: number
        credit_lines?: Array<{ metadata?: Record<string, unknown> | null }>
      }
    | undefined

  if (!cart || cart.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cart not found")
  }

  const existing = (cart.credit_lines ?? []).find(
    line => line.metadata?.source === "loyalty"
  )
  if (existing) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Points are already applied to this cart"
    )
  }

  const discount = Math.floor(points / 100) * 10
  const maxDiscount = Math.floor(Number(cart.item_subtotal || 0) * 0.1)
  const amount = Math.min(discount, maxDiscount)
  if (amount <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "These points cannot be applied to this cart"
    )
  }

  const loyalty = req.scope.resolve(MercurModules.FP) as {
    reservePoints: (input: {
      customerId: string
      points: number
      orderId: string
      idempotencyKey: string
    }) => Promise<{ id: string }>
  }

  let reservation: { id: string }
  try {
    reservation = await loyalty.reservePoints({
      customerId,
      points,
      orderId: cartId,
      idempotencyKey: `cart-points:${cartId}:${points}`,
    })
  } catch {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Not enough points are available"
    )
  }

  const cartService = req.scope.resolve(Modules.CART) as {
    updateCarts: (
      id: string,
      data: Record<string, unknown>
    ) => Promise<unknown>
  }
  await cartService.updateCarts(cartId, {
    credit_lines: [
      {
        amount,
        reference: "fp_loyalty_reservation",
        reference_id: reservation.id,
        metadata: {
          source: "loyalty",
          points,
          reservation_id: reservation.id,
        },
      },
    ],
  } as never)

  res.json({ discount_bdt: amount, reservation_id: reservation.id })
}
