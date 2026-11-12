import { ModuleProvider } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { LocalPayoutProvider } from "./local"

export { LocalPayoutProvider, isCompletePayoutDetails } from "./local"
export type { LocalPayoutProviderOptions } from "./local"

export default ModuleProvider(MercurModules.PAYOUT, {
  services: [LocalPayoutProvider],
})
