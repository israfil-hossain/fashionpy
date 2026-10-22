import { MedusaService } from "@medusajs/framework/utils"

import { HeroBanner } from "./models"

class HeroBannerModuleService extends MedusaService({
  HeroBanner,
}) { }

export default HeroBannerModuleService
