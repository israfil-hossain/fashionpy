import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetBlogPostParamsType = z.infer<typeof AdminGetBlogPostParams>
export const AdminGetBlogPostParams = createSelectParams()

export type AdminGetBlogPostsParamsType = z.infer<
  typeof AdminGetBlogPostsParams
>
export const AdminGetBlogPostsParams = createFindParams({
  offset: 0,
  limit: 20,
  order: "-created_at",
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    slug: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.enum(["draft", "published"]).optional(),
    category_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

const blogPostBody = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  cover_image_id: z.string().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.coerce.date().nullable().optional(),
  unpublished_at: z.coerce.date().nullable().optional(),
  country_codes: z.array(z.string().length(2)).nullable().optional(),
  category_id: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  author: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type AdminCreateBlogPostType = z.infer<typeof AdminCreateBlogPost>
export const AdminCreateBlogPost = blogPostBody.strict()

export type AdminUpdateBlogPostType = z.infer<typeof AdminUpdateBlogPost>
export const AdminUpdateBlogPost = blogPostBody.partial().strict()

export type AdminGetBlogCategoryParamsType = z.infer<
  typeof AdminGetBlogCategoryParams
>
export const AdminGetBlogCategoryParams = createSelectParams()

export type AdminGetBlogCategoriesParamsType = z.infer<
  typeof AdminGetBlogCategoriesParams
>
export const AdminGetBlogCategoriesParams = createFindParams({
  offset: 0,
  limit: 50,
  order: "name",
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    slug: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

export type AdminCreateBlogCategoryType = z.infer<
  typeof AdminCreateBlogCategory
>
export const AdminCreateBlogCategory = z
  .object({
    name: z.string().min(1),
    slug: z
      .string()
      .min(1)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase kebab-case"
      )
      .optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict()

export type AdminUpdateBlogCategoryType = z.infer<
  typeof AdminUpdateBlogCategory
>
export const AdminUpdateBlogCategory = z
  .object({
    name: z.string().min(1).optional(),
    slug: z
      .string()
      .min(1)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase kebab-case"
      )
      .optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict()
