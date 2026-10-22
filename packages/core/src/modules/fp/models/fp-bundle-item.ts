import { model } from "@medusajs/framework/utils"

const FpBundleItem = model
  .define("FpBundleItem", {
    id: model.id({ prefix: "fpbundleitem" }).primaryKey(),
    bundle_id: model.text(),
    offer_id: model.text().nullable(),
    variant_id: model.text().nullable(),
    quantity: model.number().default(1),
    is_required: model.boolean().default(true),
    sort_order: model.number().default(0),
    metadata: model.json().nullable(),
  })
  .indexes([
    { name: "IDX_fp_bundle_item_bundle_id", on: ["bundle_id"] },
  ])

export default FpBundleItem
