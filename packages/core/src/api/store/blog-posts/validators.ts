import { z } from "zod"
import { createFindParams, createSelectParams } from "@medusajs/medusa/api/utils/validators"

const storeBlogPostFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  slug: z.union([z.string(), z.array(z.string())]).optional(),
  category_id: z.union([z.string(), z.array(z.string())]).optional(),
  tag: z.string().optional(),
  country_code: z.string().length(2).optional(),
})

export type StoreGetBlogPostsParamsType = z.infer<typeof StoreGetBlogPostsParams>
export const StoreGetBlogPostsParams = createFindParams({
  offset: 0,
  limit: 12,
  order: "-published_at",
}).merge(storeBlogPostFields)

/** Detail route reads `slug` from the path, not the query string. */
export type StoreGetBlogPostParamsType = z.infer<typeof StoreGetBlogPostParams>
export const StoreGetBlogPostParams = createSelectParams().merge(
  z.object({
    country_code: z.string().length(2).optional(),
  })
)

export type StoreGetBlogCategoriesParamsType = z.infer<
  typeof StoreGetBlogCategoriesParams
>
export const StoreGetBlogCategoriesParams = createFindParams({
  offset: 0,
  limit: 50,
  order: "name",
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    slug: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

export type StoreGetBlogCategoryParamsType = z.infer<
  typeof StoreGetBlogCategoryParams
>
export const StoreGetBlogCategoryParams = createSelectParams()
