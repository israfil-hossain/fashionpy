import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import HeroBannerModuleService from "./service"

export default Module(MercurModules.HERO_BANNER, {
  service: HeroBannerModuleService,
})
