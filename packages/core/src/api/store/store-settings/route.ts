import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<{ announcement: unknown; home_layout: unknown }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // `query.graph` returns rows even for the single store record — reading
  // `.metadata` off the array directly made every setting (announcement
  // included) silently resolve to null.
  const { data } = await query.graph({
    entity: "store",
    fields: ["id", "name", "metadata"],
  })

  const store = (
    data as Array<{
      id?: string
      metadata?: Record<string, unknown> | null
    }>
  )[0]
  const metadata = store?.metadata ?? {}

  if (!metadata.home_layout) {
    console.warn(
      `[store-settings] store ${store?.id ?? "unknown"} has no metadata.home_layout — ` +
        "the storefront renders the default section order"
    )
  }

  res.json({
    announcement: metadata.announcement ?? null,
    home_layout: metadata.home_layout ?? null,
  })
}
