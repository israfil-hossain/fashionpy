import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { CourierAccountStatus, HttpTypes, MercurModules } from "@mercurjs/types"

import { VendorCreateCourierAccountType } from "./validators"
import type CourierModuleService from "../../../modules/courier/services/courier-module-service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCourierAccountListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: courier_accounts, metadata } = await query.graph({
    entity: "courier_account",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    courier_accounts,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateCourierAccountType>,
  res: MedusaResponse<HttpTypes.VendorCourierAccountResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const courierService = req.scope.resolve<CourierModuleService>(
    MercurModules.COURIER
  )
  const sellerId = req.seller_context!.seller_id
  const { provider, data, cod_enabled } = req.validatedBody

  // Round-trip credentials against the courier API before persisting —
  // invalid credentials never become a row.
  const validation = await courierService.validateAccountCredentials({
    provider,
    data,
  })

  if (!validation.valid) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      validation.message ?? `Invalid ${provider} credentials`
    )
  }

  const created = await courierService.createCourierAccounts({
    provider,
    seller_id: sellerId,
    status: CourierAccountStatus.ACTIVE,
    cod_enabled: cod_enabled ?? true,
    // Keep the entered credentials and merge provider extras (Pathao stores,
    // Steadfast balance) alongside them.
    data: { ...data, ...(validation.data ?? {}) },
  })

  const {
    data: [courier_account],
  } = await query.graph({
    entity: "courier_account",
    fields: req.queryConfig.fields,
    filters: { id: created.id },
  })

  res.status(201).json({ courier_account })
}
