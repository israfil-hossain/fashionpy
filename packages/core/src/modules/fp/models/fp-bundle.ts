import { model } from "@medusajs/framework/utils"

const FpBundle = model
  .define("FpBundle", {
    id: model.id({ prefix: "fpbundle" }).primaryKey(),
    seller_id: model.text(),
    title: model.text(),
    slug: model.text().nullable(),
    status: model.enum(["draft", "pending_approval", "active", "paused", "expired"]).default("draft"),
    discount_type: model.enum(["fixed_price", "percentage", "fixed_amount"]).default("fixed_price"),
    discount_value: model.number().nullable(),
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),
    max_uses: model.number().nullable(),
    uses_count: model.number().default(0),
    funding_mode: model.enum(["seller", "marketplace", "shared"]).default("seller"),
    metadata: model.json().nullable(),
  })
  .indexes([
    { name: "IDX_fp_bundle_seller_id", on: ["seller_id"] },
    { name: "IDX_fp_bundle_status", on: ["status"] },
  ])

export default FpBundle
