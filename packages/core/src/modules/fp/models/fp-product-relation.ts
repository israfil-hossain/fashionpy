import { model } from "@medusajs/framework/utils"

const FpProductRelation = model
  .define("FpProductRelation", {
    id: model.id({ prefix: "fpprodrel" }).primaryKey(),
    source_product_id: model.text(),
    target_product_id: model.text(),
    relation_type: model.enum(["upsell", "cross_sell", "frequently_bought_together"]).default("upsell"),
    priority: model.number().default(0),
    status: model.enum(["active", "inactive"]).default("active"),
    seller_id: model.text().nullable(),
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    { name: "IDX_fp_product_relation_source", on: ["source_product_id"] },
  ])

export default FpProductRelation
