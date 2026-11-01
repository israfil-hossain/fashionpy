import { ModuleProvider } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { SteadfastCourierProvider } from "./services/steadfast"

export { SteadfastCourierProvider } from "./services/steadfast"
export { SteadfastClient } from "./client"
export * from "./types"

export default ModuleProvider(MercurModules.COURIER as never, {
  services: [SteadfastCourierProvider],
})
