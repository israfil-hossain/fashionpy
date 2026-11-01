import { requirePermission } from "../../utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorCourierAccountQueryConfig } from "./query-config"
import {
  VendorCreateCourierAccount,
  VendorGetCourierAccountParams,
  VendorGetCourierAccountsParams,
  VendorUpdateCourierAccount,
} from "./validators"

const applySellerFilter = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: any
) => {
  // courier_account.seller_id is a plain column — direct filter, no link hop
  req.filterableFields.seller_id = req.seller_context!.seller_id
  return next()
}

export const vendorCourierAccountsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/courier-accounts",
    middlewares: [
      requirePermission("courier_accounts", "view"),
      validateAndTransformQuery(
        VendorGetCourierAccountsParams,
        vendorCourierAccountQueryConfig.list
      ),
      applySellerFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/courier-accounts",
    middlewares: [
      requirePermission("courier_accounts", "edit"),
      validateAndTransformBody(VendorCreateCourierAccount),
      validateAndTransformQuery(
        VendorGetCourierAccountParams,
        vendorCourierAccountQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/courier-accounts/:id",
    middlewares: [
      requirePermission("courier_accounts", "view"),
      validateAndTransformQuery(
        VendorGetCourierAccountParams,
        vendorCourierAccountQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["PATCH"],
    matcher: "/vendor/courier-accounts/:id",
    middlewares: [
      requirePermission("courier_accounts", "edit"),
      validateAndTransformBody(VendorUpdateCourierAccount),
      validateAndTransformQuery(
        VendorGetCourierAccountParams,
        vendorCourierAccountQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/courier-accounts/:id",
    middlewares: [
      requirePermission("courier_accounts", "edit"),
      validateAndTransformQuery(
        VendorGetCourierAccountParams,
        vendorCourierAccountQueryConfig.retrieve
      ),
    ],
  },
]
