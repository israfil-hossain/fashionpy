import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { MercurModules } from "@mercurjs/types"
import PolicyPageModuleService from "../../../../modules/policy-page/service"

import { AdminUpdatePolicyPageType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPolicyPageResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [policy_page],
  } = await query.graph({
    entity: "policy_page",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!policy_page) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Policy page with id ${req.params.id} was not found`
    )
  }

  res.json({ policy_page })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdatePolicyPageType>,
  res: MedusaResponse<HttpTypes.AdminPolicyPageResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const service = req.scope.resolve<PolicyPageModuleService>(
    MercurModules.POLICY_PAGE
  )

  const {
    data: [existing],
  } = await query.graph({
    entity: "policy_page",
    fields: ["id", "status"],
    filters: { id: req.params.id },
  })

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Policy page with id ${req.params.id} was not found`
    )
  }

  const payload = { ...req.validatedBody }

  if (
    payload.status === "published" &&
    payload.published_at === undefined &&
    existing.status !== "published"
  ) {
    payload.published_at = new Date()
  }

  if (payload.country_codes !== undefined) {
    payload.country_codes = payload.country_codes?.length
      ? payload.country_codes
      : null
  }

  await service.updatePolicyPages({ id: req.params.id, ...payload })

  const {
    data: [policy_page],
  } = await query.graph({
    entity: "policy_page",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ policy_page })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPolicyPageDeleteResponse>
) => {
  const service = req.scope.resolve<PolicyPageModuleService>(
    MercurModules.POLICY_PAGE
  )

  await service.softDeletePolicyPages([req.params.id])

  res.json({
    id: req.params.id,
    object: "policy_page",
    deleted: true,
  })
}
