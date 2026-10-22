import { model } from "@medusajs/framework/utils"

/**
 * A marketplace-owned hero slide for the storefront carousel. One row per
 * slide; ordering comes from `rank`, visibility from `is_active` and the
 * optional `starts_at` / `ends_at` window (both null = always).
 *
 * Table is `hero_banner` and the model name is `HeroBanner` — neither
 * collides with Medusa's product image or Mercur's media models.
 */
const HeroBanner = model.define(
  { tableName: "hero_banner", name: "HeroBanner" },
  {
    id: model.id({ prefix: "hbnr" }).primaryKey(),
    title: model.text(),
    subtitle: model.text().nullable(),
    description: model.text().nullable(),
    image_url: model.text(),
    cta_text: model.text().nullable(),
    cta_link: model.text().nullable(),
    text_position: model.enum(["left", "center", "right"]).default("left"),
    slot: model.enum(["hero", "company_1", "company_2", "offer_price"]).default("hero"),
    is_active: model.boolean().default(true),
    rank: model.number().default(0),
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  }
).indexes([
  {
    name: "IDX_hero_banner_rank",
    on: ["rank"],
  },
  {
    name: "IDX_hero_banner_slot",
    on: ["slot"],
  },
])

export default HeroBanner
