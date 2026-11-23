import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  enforceAiRateLimit,
  consumeAiProductCredit,
  generateProductDraft,
  refundAiProductCredit,
  sendAiHttpError,
  type AiProductDraft,
  type AiProductDraftBodyType,
  type AiProductQuota,
} from "../../../../../ai"

export const POST = async (
  req: AuthenticatedMedusaRequest<AiProductDraftBodyType>,
  res: MedusaResponse<{ product: AiProductDraft; ai_quota: AiProductQuota }>
) => {
  const sellerId = req.seller_context!.seller_id
  const { image_urls, image_data_urls, source_url, hints } = req.validatedBody

  if (!image_urls?.length && !image_data_urls?.length && !source_url) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Provide at least one product image or a product page URL"
    )
  }

  await enforceAiRateLimit(req.scope, `ai:vendor:${sellerId}`)
  const quota = await consumeAiProductCredit(req.scope, sellerId)

  try {
    const product = await generateProductDraft({
      container: req.scope,
      image_urls,
      image_data_urls,
      source_url,
      hints,
    })

    res.json({ product, ai_quota: quota })
  } catch (error) {
    await refundAiProductCredit(req.scope, sellerId)
    if (!sendAiHttpError(error, res)) {
      throw error
    }
  }
}
