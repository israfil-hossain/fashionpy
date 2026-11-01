import type { ModuleJoinerConfig } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"

import { joinerConfig } from "./joiner-config"
import { NotificationFeed } from "./models"

class NotificationFeedModuleService extends MedusaService({
  NotificationFeed,
}) {
  __joinerConfig(): ModuleJoinerConfig {
    return joinerConfig
  }
}

export default NotificationFeedModuleService
