import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { CourierAccountStatus, HttpTypes, MercurModules } from "@mercurjs/types"

import { VendorUpdateCourierAccountType } from "../validators"
import type CourierModuleService from "../../../../modules/courier/services/courier-module-service"

/**
 * Load a courier account scoped to the acting seller — vendors must never see
 * or touch each other's (or the platform's) credentials.
 */
const retrieveSellerCourierAccount = async (
  req: AuthenticatedMedusaRequest,
  id: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [courier_account],
  } = await query.graph({
    entity: "courier_account",
    fields: ["id", "provider", "seller_id", "status", "cod_enabled", "data"],
    filters: { id, seller_id: req.seller_context!.seller_id },
  })

  if (!courier_account) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Courier account with id ${id} was not found`
    )
  }

  return courier_account
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCourierAccountResponse>
) => {
  const courier_account = await retrieveSellerCourierAccount(
    req,
    req.params.id
  )

  // Never expose stored credentials
  const { data: _data, ...safe } = courier_account as any

  res.json({ courier_account: safe })
}

export const PATCH = async (
  req: AuthenticatedMedusaRequest<VendorUpdateCourierAccountType>,
  res: MedusaResponse<HttpTypes.VendorCourierAccountResponse>
) => {
  const courierService = req.scope.resolve<CourierModuleService>(
    MercurModules.COURIER
  )
  const existing = await retrieveSellerCourierAccount(req, req.params.id)
  const { data, cod_enabled } = req.validatedBody

  const updates: Record<string, unknown> = {}
  if (cod_enabled !== undefined) updates.cod_enabled = cod_enabled

  if (data) {
    const provider = (existing as any).provider as string
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
    updates.data = { ...data, ...(validation.data ?? {}) }
    updates.status = CourierAccountStatus.ACTIVE
  }

  await courierService.updateCourierAccounts(
    { id: req.params.id, ...updates } as any
  )

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [courier_account],
  } = await query.graph({
    entity: "courier_account",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id, seller_id: req.seller_context!.seller_id },
  })

  res.json({ courier_account })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCourierAccountDeleteResponse>
) => {
  const courierService = req.scope.resolve<CourierModuleService>(
    MercurModules.COURIER
  )

  await retrieveSellerCourierAccount(req, req.params.id)
  await courierService.deleteCourierAccounts(req.params.id)

  res.json({ id: req.params.id, object: "courier_account", deleted: true })
}
