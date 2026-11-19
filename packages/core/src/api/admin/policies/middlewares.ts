import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminPolicyPageQueryConfig } from "./query-config"
import {
  AdminCreatePolicyPage,
  AdminGetPolicyPageParams,
  AdminGetPolicyPagesParams,
  AdminUpdatePolicyPage,
} from "./validators"

export const adminPoliciesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/policies",
    middlewares: [
      requirePermission("policy", "view"),
      validateAndTransformQuery(
        AdminGetPolicyPagesParams,
        adminPolicyPageQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/policies",
    middlewares: [
      requirePermission("policy", "edit"),
      validateAndTransformBody(AdminCreatePolicyPage),
      validateAndTransformQuery(
        AdminGetPolicyPageParams,
        adminPolicyPageQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/policies/:id",
    middlewares: [
      requirePermission("policy", "view"),
      validateAndTransformQuery(
        AdminGetPolicyPageParams,
        adminPolicyPageQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/policies/:id",
    middlewares: [
      requirePermission("policy", "edit"),
      validateAndTransformBody(AdminUpdatePolicyPage),
      validateAndTransformQuery(
        AdminGetPolicyPageParams,
        adminPolicyPageQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/policies/:id",
    middlewares: [requirePermission("policy", "manage")],
  },
]
