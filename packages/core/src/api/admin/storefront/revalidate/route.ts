import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Admin saves only mutate React Query state — the storefront's `store`-tagged
 * data (home layout, announcement, nav) would otherwise sit stale until its
 * TTL. Emitting `store.updated` here reuses the existing
 * `storefront-cache-revalidate` subscriber, which POSTs the storefront
 * `/api/revalidate` endpoint for the `store` tag.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ revalidated: boolean }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [store],
  } = await query.graph({
    entity: "store",
    fields: ["id"],
    pagination: { take: 1 },
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: "store.updated",
    data: [{ id: store?.id ?? "store" }],
  })

  res.json({ revalidated: true })
}
