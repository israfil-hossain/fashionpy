import { model } from "@medusajs/framework/utils"

const FpRewardRule = model
  .define("FpRewardRule", {
    id: model.id({ prefix: "fprewardrule" }).primaryKey(),
    name: model.text().nullable(),
    points_per_unit: model.number().default(5),
    spend_unit: model.number().default(100),
    points_per_currency_unit: model.number().nullable(),
    minimum_redemption: model.number().default(500),
    maximum_discount_percent: model.number().default(10),
    expiry_days: model.number().default(365),
    active_from: model.dateTime().nullable(),
    active_until: model.dateTime().nullable(),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })

export default FpRewardRule
