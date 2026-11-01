import { ModuleProvider } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { PathaoCourierProvider } from "./services/pathao"

export { PathaoCourierProvider } from "./services/pathao"
export { PathaoClient } from "./client"
export * from "./types"

export default ModuleProvider(MercurModules.COURIER as never, {
  services: [PathaoCourierProvider],
})
