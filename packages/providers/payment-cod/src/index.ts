import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import { CodPaymentProvider } from "./services/cod"

export { CodPaymentProvider } from "./services/cod"

export default ModuleProvider(Modules.PAYMENT, {
  services: [CodPaymentProvider],
})
