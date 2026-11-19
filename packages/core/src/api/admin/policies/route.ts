import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { MercurModules } from "@mercurjs/types"
import PolicyPageModuleService from "../../../modules/policy-page/service"

import {
  AdminCreatePolicyPageType,
  AdminGetPolicyPagesParamsType,
} from "./validators"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
}

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetPolicyPagesParamsType>,
  res: MedusaResponse<HttpTypes.AdminPolicyPageListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { q, ...filters } = req.filterableFields

  if (q) {
    filters.$or = [
      { title: { $ilike: `%${q}%` } },
      { slug: { $ilike: `%${q}%` } },
      { excerpt: { $ilike: `%${q}%` } },
    ]
  }

  const { data: policy_pages, metadata } = await query.graph({
    entity: "policy_page",
    fields: req.queryConfig.fields,
    filters,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    policy_pages,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreatePolicyPageType>,
  res: MedusaResponse<HttpTypes.AdminPolicyPageResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const service = req.scope.resolve<PolicyPageModuleService>(
    MercurModules.POLICY_PAGE
  )

  const { slug, status, published_at, country_codes, ...rest } =
    req.validatedBody

  const finalSlug = slug ?? slugify(rest.title)
  const now = new Date()

  const created = await service.createPolicyPages({
    ...rest,
    slug: finalSlug,
    status: status ?? "draft",
    published_at:
      status === "published" ? (published_at ?? now) : published_at ?? null,
    // Empty array and null both mean "every country"; store null so the
    // store-side `$or: [{ country_codes: null }, { $contains }]` matches.
    country_codes: country_codes?.length ? country_codes : null,
  })

  const {
    data: [policy_page],
  } = await query.graph({
    entity: "policy_page",
    fields: req.queryConfig.fields,
    filters: { id: (created as { id: string }).id },
  })

  res.status(201).json({ policy_page })
}
