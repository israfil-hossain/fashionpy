import { requirePermission } from "../../utils"
import { MiddlewareRoute, maybeApplyLinkFilter } from "@medusajs/framework/http"
import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"

import { adminPayoutQueryConfig } from "./query-config"
import {
  AdminBulkMarkPayoutPaid,
  AdminExportPayouts,
  AdminGetPayoutParams,
  AdminGetPayoutsParams,
  AdminMarkPayoutPaid,
} from "./validators"

export const adminPayoutsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/payouts/:id/retry",
    middlewares: [
      requirePermission("payouts", "edit"),
      validateAndTransformQuery(AdminGetPayoutParams, adminPayoutQueryConfig.retrieve),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/payouts/:id/mark-paid",
    middlewares: [
      requirePermission("payouts", "edit"),
      validateAndTransformBody(AdminMarkPayoutPaid),
      validateAndTransformQuery(AdminGetPayoutParams, adminPayoutQueryConfig.retrieve),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/payouts/mark-paid",
    middlewares: [
      requirePermission("payouts", "edit"),
      validateAndTransformBody(AdminBulkMarkPayoutPaid),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/payouts/export",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformBody(AdminExportPayouts),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/payouts",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformQuery(
        AdminGetPayoutsParams,
        adminPayoutQueryConfig.list
      ),
      maybeApplyLinkFilter({
        entryPoint: "seller_payout_account",
        resourceId: "payout_account_id",
        filterableField: "seller_id",
        filterByField: "account_id",
      }),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/payouts/:id",
    middlewares: [
      requirePermission("payouts", "view"),
      validateAndTransformQuery(
        AdminGetPayoutParams,
        adminPayoutQueryConfig.retrieve
      ),
    ],
  },
]
