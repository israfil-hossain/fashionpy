import { defineJoinerConfig } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import NotificationFeed from "./models/notification"

export const joinerConfig = defineJoinerConfig(MercurModules.NOTIFICATION_FEED, {
  linkableKeys: {
    notification_feed_id: NotificationFeed.name,
  },
})
