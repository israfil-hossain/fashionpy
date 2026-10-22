import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import FpModuleService from "./service"

export default Module(MercurModules.FP, {
  service: FpModuleService,
})
