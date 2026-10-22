import { model } from "@medusajs/framework/utils"

const FpPromotion = model
  .define("FpPromotion", {
    id: model.id({ prefix: "fppromo" }).primaryKey(),
    code: model.text().nullable(),
    name: model.text().nullable(),
    status: model.enum(["draft", "active", "paused", "expired"]).default("draft"),
    minimum_spend: model.number().nullable(),
    discount_cap: model.number().nullable(),
    max_uses: model.number().nullable(),
    uses_count: model.number().default(0),
    combinable: model.boolean().default(false),
    funding_mode: model.enum(["seller", "marketplace", "shared"]).default("marketplace"),
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  })

export default FpPromotion
