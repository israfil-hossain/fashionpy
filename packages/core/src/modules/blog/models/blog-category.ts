import { model } from "@medusajs/framework/utils"

import BlogPost from "./blog-post"

const BlogCategory = model
  .define({ tableName: "blog_category", name: "BlogCategory" }, {
    id: model.id({ prefix: "btgc" }).primaryKey(),
    name: model.text(),
    slug: model.text().searchable(),
    posts: model.hasMany(() => BlogPost, { mappedBy: "category" }),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_blog_category_slug_unique",
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default BlogCategory
