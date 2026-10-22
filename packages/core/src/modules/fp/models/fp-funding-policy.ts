import { model } from "@medusajs/framework/utils"

const FpFundingPolicy = model
  .define("FpFundingPolicy", {
    id: model.id({ prefix: "fpfundpol" }).primaryKey(),
    name: model.text().nullable(),
    default_split_marketplace_percent: model.number().default(40),
    seller_cap: model.number().nullable(),
    marketplace_budget_cap: model.number().nullable(),
    eligible_promotion_types: model.json().nullable(),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })

export default FpFundingPolicy
