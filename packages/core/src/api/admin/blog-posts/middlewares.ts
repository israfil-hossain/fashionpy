import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminBlogPostQueryConfig } from "./query-config"
import {
  AdminCreateBlogPost,
  AdminGetBlogPostParams,
  AdminGetBlogPostsParams,
  AdminUpdateBlogPost,
} from "./validators"

export const adminBlogPostsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/blog-posts",
    middlewares: [
      requirePermission("blog", "view"),
      validateAndTransformQuery(
        AdminGetBlogPostsParams,
        adminBlogPostQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/blog-posts",
    middlewares: [
      requirePermission("blog", "edit"),
      validateAndTransformBody(AdminCreateBlogPost),
      validateAndTransformQuery(
        AdminGetBlogPostParams,
        adminBlogPostQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/blog-posts/:id",
    middlewares: [
      requirePermission("blog", "view"),
      validateAndTransformQuery(
        AdminGetBlogPostParams,
        adminBlogPostQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/blog-posts/:id",
    middlewares: [
      requirePermission("blog", "edit"),
      validateAndTransformBody(AdminUpdateBlogPost),
      validateAndTransformQuery(
        AdminGetBlogPostParams,
        adminBlogPostQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/blog-posts/:id",
    middlewares: [requirePermission("blog", "manage")],
  },
]
