import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminCourierShipmentQueryConfig } from "./query-config"
import {
  AdminGetCourierShipmentParams,
  AdminGetCourierShipmentsParams,
  AdminMarkCodRemitted,
} from "./validators"

export const adminCourierShipmentsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/courier-shipments",
    middlewares: [
      requirePermission("orders", "view"),
      validateAndTransformQuery(
        AdminGetCourierShipmentsParams,
        adminCourierShipmentQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/courier-shipments/:id",
    middlewares: [
      requirePermission("orders", "view"),
      validateAndTransformQuery(
        AdminGetCourierShipmentParams,
        adminCourierShipmentQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/courier-shipments/:id/remittance",
    middlewares: [
      requirePermission("payouts", "edit"),
      validateAndTransformBody(AdminMarkCodRemitted),
      validateAndTransformQuery(
        AdminGetCourierShipmentParams,
        adminCourierShipmentQueryConfig.retrieve
      ),
    ],
  },
]
