import { MedusaService } from "@medusajs/framework/utils"

import { PolicyPage } from "./models"

class PolicyPageModuleService extends MedusaService({
  PolicyPage,
}) {}

export default PolicyPageModuleService
