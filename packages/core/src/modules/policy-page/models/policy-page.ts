import { model } from "@medusajs/framework/utils"

/**
 * Marketplace-owned storefront legal/policy page (privacy, terms, shipping…).
 * Visibility is derived from `status` + the `published_at` / `unpublished_at`
 * window (store routes enforce it; admin sees everything). `country_codes`
 * empty/null means the page is visible in every country; otherwise only in
 * listed ISO2s.
 */
const PolicyPage = model
  .define({ tableName: "policy_page", name: "PolicyPage" }, {
    id: model.id({ prefix: "plic" }).primaryKey(),
    title: model.text().searchable(),
    slug: model.text().searchable(),
    excerpt: model.text().nullable(),
    content: model.text().nullable(),
    status: model.enum(["draft", "published"]).default("draft"),
    published_at: model.dateTime().nullable(),
    unpublished_at: model.dateTime().nullable(),
    country_codes: model.array().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_policy_page_slug_unique",
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_policy_page_status_published_at",
      on: ["status", "published_at"],
      where: "deleted_at IS NULL",
    },
  ])

export default PolicyPage
