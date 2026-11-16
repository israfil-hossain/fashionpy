import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@medusajs/types"

import { AdminCreateCollectionType } from "./validators"
import { createProductCollectionWithImagesWorkflow } from "../../../workflows/media/workflows/create-product-collection-with-images"
import { isRankOrder, listCollectionsByRank } from "../../utils/collection-rank"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminCollectionListResponse>
) => {
  const { skip, take, order } = req.queryConfig.pagination

  // `rank` lives in metadata, so it cannot be a database order field — the
  // rank path sorts in memory before paging.
  const { data: collections, metadata } = isRankOrder(order)
    ? await listCollectionsByRank<HttpTypes.AdminCollection>(req.scope, {
        fields: req.queryConfig.fields,
        filters: req.filterableFields,
        pagination: { skip, take, order },
      })
    : await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({
        entity: "product_collection",
        fields: req.queryConfig.fields,
        filters: req.filterableFields,
        pagination: req.queryConfig.pagination,
      })

  res.json({
    collections,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateCollectionType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    additional_data: _additional_data,
    media,
    icon,
    rank,
    metadata,
    ...payload
  } = req.validatedBody

  const collectionPayload = {
    ...payload,
    ...(rank != null
      ? { metadata: { ...metadata, rank } }
      : metadata !== undefined && metadata !== null
        ? { metadata }
        : {}),
  }

  const { result: createdId } =
    await createProductCollectionWithImagesWorkflow(req.scope).run({
      input: { collection: collectionPayload, media, icon },
    })

  const {
    data: [collection],
  } = await query.graph({
    entity: "product_collection",
    fields: req.queryConfig.fields,
    filters: { id: createdId },
  })

  res.status(200).json({ collection })
}
