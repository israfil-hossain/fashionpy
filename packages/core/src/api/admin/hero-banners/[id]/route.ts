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
import HeroBannerModuleService from "../../../../modules/hero-banner/service"

import { AdminUpdateHeroBannerType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminHeroBannerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [hero_banner],
  } = await query.graph({
    entity: "hero_banner",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!hero_banner) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Hero banner with id ${req.params.id} was not found`
    )
  }

  res.json({ hero_banner })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateHeroBannerType>,
  res: MedusaResponse<HttpTypes.AdminHeroBannerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const service = req.scope.resolve<HeroBannerModuleService>(MercurModules.HERO_BANNER)

  const {
    data: [existing],
  } = await query.graph({
    entity: "hero_banner",
    fields: ["id"],
    filters: { id: req.params.id },
  })

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Hero banner with id ${req.params.id} was not found`
    )
  }

  await service.updateHeroBanners({ id: req.params.id, ...req.validatedBody })

  const {
    data: [hero_banner],
  } = await query.graph({
    entity: "hero_banner",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ hero_banner })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminHeroBannerDeleteResponse>
) => {
  const service = req.scope.resolve<HeroBannerModuleService>(MercurModules.HERO_BANNER)

  await service.softDeleteHeroBanners([req.params.id])

res.json({
    id: req.params.id,
    object: "hero_banner",
    deleted: true,
  })
}
