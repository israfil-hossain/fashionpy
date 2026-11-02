import { requirePermission } from "../../utils"
import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminCourierAccountQueryConfig } from "./query-config"
import {
  AdminCreateCourierAccount,
  AdminGetCourierAccountParams,
  AdminGetCourierAccountsParams,
} from "./validators"

export const adminCourierAccountsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/courier-accounts",
    middlewares: [
      requirePermission("courier_accounts", "view"),
      validateAndTransformQuery(
        AdminGetCourierAccountsParams,
        adminCourierAccountQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/courier-accounts",
    middlewares: [
      requirePermission("courier_accounts", "edit"),
      validateAndTransformBody(AdminCreateCourierAccount),
      validateAndTransformQuery(
        AdminGetCourierAccountParams,
        adminCourierAccountQueryConfig.retrieve
      ),
    ],
  },
]
