import { model } from "@medusajs/framework/utils"

const FpPromotionApplication = model
  .define("FpPromotionApplication", {
    id: model.id({ prefix: "fppromoapp" }).primaryKey(),
    promotion_id: model.text().nullable(),
    cart_id: model.text().nullable(),
    order_id: model.text().nullable(),
    order_group_id: model.text().nullable(),
    discount_amount: model.number().default(0),
    snapshot: model.json().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { name: "IDX_fp_promo_app_order_id", on: ["order_id"] },
    { name: "IDX_fp_promo_app_cart_id", on: ["cart_id"] },
  ])

export default FpPromotionApplication
