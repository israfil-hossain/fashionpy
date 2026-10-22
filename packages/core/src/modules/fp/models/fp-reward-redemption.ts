import { model } from "@medusajs/framework/utils"

const FpRewardRedemption = model
  .define("FpRewardRedemption", {
    id: model.id({ prefix: "fpredeem" }).primaryKey(),
    customer_id: model.text(),
    order_id: model.text().nullable(),
    order_group_id: model.text().nullable(),
    points_reserved: model.number().default(0),
    points_redeemed: model.number().default(0),
    discount_amount: model.number().default(0),
    conversion_rate: model.number().nullable(),
    status: model.enum(["reserved", "redeemed", "released", "reversed"]).default("reserved"),
    expires_at: model.dateTime().nullable(),
    idempotency_key: model.text().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { name: "IDX_fp_reward_redemption_customer", on: ["customer_id"] },
    { name: "IDX_fp_reward_redemption_idempotency", on: ["idempotency_key"], unique: true, where: "deleted_at IS NULL AND idempotency_key IS NOT NULL" },
  ])

export default FpRewardRedemption
