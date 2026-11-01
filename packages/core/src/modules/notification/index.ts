import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import NotificationFeedModuleService from "./service"

export { NotificationFeedModuleService }
export * from "./models"

export default Module(MercurModules.NOTIFICATION_FEED, {
  service: NotificationFeedModuleService,
})
