import { model } from "@medusajs/framework/utils"

const FpLoyaltyTransaction = model
  .define("FpLoyaltyTransaction", {
    id: model.id({ prefix: "fploytxn" }).primaryKey(),
    account_id: model.text(),
    order_id: model.text().nullable(),
    type: model.enum(["earn", "redeem", "reserve", "release", "reverse", "adjust", "expire"]).default("earn"),
    points_delta: model.number().default(0),
    status: model.enum(["pending", "committed", "reversed"]).default("committed"),
    expires_at: model.dateTime().nullable(),
    idempotency_key: model.text().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { name: "IDX_fp_loyalty_txn_account_id", on: ["account_id"] },
    { name: "IDX_fp_loyalty_txn_idempotency", on: ["idempotency_key"], unique: true, where: "deleted_at IS NULL AND idempotency_key IS NOT NULL" },
  ])

export default FpLoyaltyTransaction
