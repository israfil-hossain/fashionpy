import { model } from "@medusajs/framework/utils"

const FpDiscountAllocation = model
  .define("FpDiscountAllocation", {
    id: model.id({ prefix: "fpdiscalloc" }).primaryKey(),
    order_id: model.text().nullable(),
    order_line_id: model.text().nullable(),
    promotion_application_id: model.text().nullable(),
    funding_party: model.enum(["marketplace", "seller"]).default("marketplace"),
    seller_id: model.text().nullable(),
    amount: model.number().default(0),
    status: model.enum(["estimated", "committed", "reversed", "settled"]).default("estimated"),
    metadata: model.json().nullable(),
  })
  .indexes([
    { name: "IDX_fp_discount_alloc_order_id", on: ["order_id"] },
    { name: "IDX_fp_discount_alloc_seller_id", on: ["seller_id"] },
  ])

export default FpDiscountAllocation
