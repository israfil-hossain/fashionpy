import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import CourierModuleService from "./services/courier-module-service"
import loadProviders from "./loaders/providers"

export default Module(MercurModules.COURIER, {
  service: CourierModuleService,
  loaders: [loadProviders],
})
