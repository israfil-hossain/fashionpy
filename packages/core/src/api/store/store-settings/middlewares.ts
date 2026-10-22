import { MiddlewareRoute } from "@medusajs/medusa"

export const storeStoreSettingsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/store-settings",
  },
]