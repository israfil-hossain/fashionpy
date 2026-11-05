import { model } from "@medusajs/framework/utils"

import BlogCategory from "./blog-category"

/**
 * Marketplace-owned storefront blog post. Visibility is derived from
 * `status` + the `published_at` / `unpublished_at` window (store routes
 * enforce it; admin sees everything). `country_codes` empty/null means
 * the post is visible in every country; otherwise only in listed ISO2s.
 */
const BlogPost = model
  .define({ tableName: "blog_post", name: "BlogPost" }, {
    id: model.id({ prefix: "blgp" }).primaryKey(),
    title: model.text().searchable(),
    slug: model.text().searchable(),
    excerpt: model.text().nullable(),
    content: model.text().nullable(),
    cover_image_id: model.text().nullable(),
    cover_image_url: model.text().nullable(),
    status: model.enum(["draft", "published"]).default("draft"),
    published_at: model.dateTime().nullable(),
    unpublished_at: model.dateTime().nullable(),
    country_codes: model.array().nullable(),
    tags: model.array().nullable(),
    author: model.text().nullable(),
    category: model
      .belongsTo(() => BlogCategory, { mappedBy: "posts" })
      .nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_blog_post_slug_unique",
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_blog_post_status_published_at",
      on: ["status", "published_at"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_blog_post_category_id",
      on: ["category_id"],
      where: "deleted_at IS NULL AND category_id IS NOT NULL",
    },
  ])

export default BlogPost
