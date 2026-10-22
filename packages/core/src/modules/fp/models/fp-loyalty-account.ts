import { model } from "@medusajs/framework/utils"

const FpLoyaltyAccount = model
  .define("FpLoyaltyAccount", {
    id: model.id({ prefix: "fployacct" }).primaryKey(),
    customer_id: model.text(),
    available_points: model.number().default(0),
    pending_points: model.number().default(0),
    lifetime_earned: model.number().default(0),
    lifetime_redeemed: model.number().default(0),
    status: model.enum(["active", "suspended", "closed"]).default("active"),
    metadata: model.json().nullable(),
  })
  .indexes([
    { name: "IDX_fp_loyalty_account_customer_id", on: ["customer_id"], unique: true, where: "deleted_at IS NULL" },
  ])

export default FpLoyaltyAccount
