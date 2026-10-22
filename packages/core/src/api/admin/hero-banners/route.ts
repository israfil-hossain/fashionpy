import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { MercurModules } from "@mercurjs/types"
import HeroBannerModuleService from "../../../modules/hero-banner/service"

import { AdminCreateHeroBannerType, AdminGetHeroBannersParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetHeroBannersParamsType>,
  res: MedusaResponse<HttpTypes.AdminHeroBannerListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: hero_banners, metadata } = await query.graph({
    entity: "hero_banner",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    hero_banners,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateHeroBannerType>,
  res: MedusaResponse<HttpTypes.AdminHeroBannerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const service = req.scope.resolve<HeroBannerModuleService>(MercurModules.HERO_BANNER)

  const created = await service.createHeroBanners(req.validatedBody)

  const {
    data: [hero_banner],
  } = await query.graph({
    entity: "hero_banner",
    fields: req.queryConfig.fields,
    filters: { id: (created as any).id },
  })

  res.status(201).json({ hero_banner })
}
