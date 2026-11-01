import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  CourierAccountStatus,
  HttpTypes,
  MercurModules,
} from "@mercurjs/types"

import { AdminCreateCourierAccountType } from "./validators"
import type CourierModuleService from "../../../modules/courier/services/courier-module-service"

const platformEnvStatus = (service: CourierModuleService) => {
  const platform = service.getOptions()?.platform ?? {}
  return {
    pathao: !!(platform as Record<string, unknown>).pathao,
    steadfast: !!(platform as Record<string, unknown>).steadfast,
  }
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCourierAccountListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const courierService = req.scope.resolve<CourierModuleService>(
    MercurModules.COURIER
  )

  const { data: courier_accounts, metadata } = await query.graph({
    entity: "courier_account",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  // Resolve seller display names for connected accounts
  const sellerIds = [
    ...new Set(
      (courier_accounts ?? [])
        .map((a: { seller_id?: string | null }) => a.seller_id)
        .filter(Boolean)
    ),
  ]
  const sellerNames = new Map<string, string>()
  if (sellerIds.length) {
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "name"],
      filters: { id: sellerIds },
    })
    for (const seller of sellers ?? []) {
      sellerNames.set(seller.id, seller.name ?? seller.id)
    }
  }

  res.json({
    courier_accounts: (courier_accounts ?? []).map((account: any) => ({
      ...account,
      seller_name: account.seller_id
        ? sellerNames.get(account.seller_id) ?? null
        : null,
    })),
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
    platform_env: platformEnvStatus(courierService),
  })
}

/**
 * Upsert the platform courier account (seller_id = NULL) after validating the
 * credentials against the courier API.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateCourierAccountType>,
  res: MedusaResponse<HttpTypes.AdminCourierAccountResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const courierService = req.scope.resolve<CourierModuleService>(
    MercurModules.COURIER
  )
  const { provider, data, cod_enabled } = req.validatedBody

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

  const mergedData = { ...data, ...(validation.data ?? {}) }

  const existingAccounts = await courierService.listCourierAccounts({
    provider,
  })
  const existing = existingAccounts.find((a) => !a.seller_id)

  let accountId: string
  if (existing) {
    const updated = await courierService.updateCourierAccounts({
      id: existing.id,
      data: mergedData,
      status: CourierAccountStatus.ACTIVE,
      ...(cod_enabled !== undefined ? { cod_enabled } : {}),
    } as any)
    accountId = updated.id
  } else {
    const created = await courierService.createCourierAccounts({
      provider,
      seller_id: null,
      status: CourierAccountStatus.ACTIVE,
      cod_enabled: cod_enabled ?? true,
      data: mergedData,
    })
    accountId = created.id
  }

  const {
    data: [courier_account],
  } = await query.graph({
    entity: "courier_account",
    fields: req.queryConfig.fields,
    filters: { id: accountId },
  })

  res.status(existing ? 200 : 201).json({
    courier_account,
    platform_env: platformEnvStatus(courierService),
  })
}
