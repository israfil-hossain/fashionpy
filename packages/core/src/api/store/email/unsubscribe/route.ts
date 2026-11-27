import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

import {
  verifyUnsubscribeToken,
  type UnsubscribePayload,
} from "../../../../email/unsubscribe"

export const POST = async (
  req: MedusaStoreRequest<{ token?: string }>,
  res: MedusaResponse
) => {
  const token = req.body?.token
  const payload: UnsubscribePayload | null = token
    ? verifyUnsubscribeToken(token)
    : null

  if (!payload) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid unsubscribe link"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "metadata"],
    filters: { id: payload.customerId },
  })
  const customer = data[0] as
    | { id: string; metadata?: Record<string, unknown> | null }
    | undefined

  if (!customer) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found")
  }

  const existing = customer.metadata?.email_opt_out
  const optedOut = Array.isArray(existing)
    ? existing
    : typeof existing === "string"
    ? [existing]
    : existing === true
    ? ["all"]
    : []
  const next = Array.from(
    new Set([...optedOut, payload.kind === "all" ? "all" : payload.kind])
  )

  const customerService = req.scope.resolve(Modules.CUSTOMER) as {
    updateCustomers: (
      id: string,
      data: { metadata: Record<string, unknown> }
    ) => Promise<unknown>
  }
  await customerService.updateCustomers(customer.id, {
    metadata: { ...(customer.metadata ?? {}), email_opt_out: next },
  })

  res.json({ success: true, opted_out: next })
}
