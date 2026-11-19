import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import PolicyPageModuleService from "./service"

export default Module(MercurModules.POLICY_PAGE, {
  service: PolicyPageModuleService,
})
