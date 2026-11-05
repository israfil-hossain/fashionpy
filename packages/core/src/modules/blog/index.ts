import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import BlogModuleService from "./service"

export default Module(MercurModules.BLOG, {
  service: BlogModuleService,
})
