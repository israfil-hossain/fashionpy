import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminBlogCategoryQueryConfig } from "../blog-posts/query-config"
import {
  AdminCreateBlogCategory,
  AdminGetBlogCategoriesParams,
  AdminGetBlogCategoryParams,
  AdminUpdateBlogCategory,
} from "../blog-posts/validators"

export const adminBlogCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/blog-categories",
    middlewares: [
      requirePermission("blog", "view"),
      validateAndTransformQuery(
        AdminGetBlogCategoriesParams,
        adminBlogCategoryQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/blog-categories",
    middlewares: [
      requirePermission("blog", "edit"),
      validateAndTransformBody(AdminCreateBlogCategory),
      validateAndTransformQuery(
        AdminGetBlogCategoryParams,
        adminBlogCategoryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/blog-categories/:id",
    middlewares: [
      requirePermission("blog", "view"),
      validateAndTransformQuery(
        AdminGetBlogCategoryParams,
        adminBlogCategoryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/blog-categories/:id",
    middlewares: [
      requirePermission("blog", "edit"),
      validateAndTransformBody(AdminUpdateBlogCategory),
      validateAndTransformQuery(
        AdminGetBlogCategoryParams,
        adminBlogCategoryQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/blog-categories/:id",
    middlewares: [requirePermission("blog", "manage")],
  },
]
