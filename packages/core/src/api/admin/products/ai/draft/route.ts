import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  enforceAiRateLimit,
  generateProductDraft,
  sendAiHttpError,
  type AiProductDraft,
  type AiProductDraftBodyType,
} from "../../../../../ai"

export const POST = async (
  req: AuthenticatedMedusaRequest<AiProductDraftBodyType>,
  res: MedusaResponse<{ product: AiProductDraft }>
) => {
  const { image_urls, image_data_urls, source_url, hints } = req.validatedBody

  if (!image_urls?.length && !image_data_urls?.length && !source_url) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Provide at least one product image or a product page URL"
    )
  }

  await enforceAiRateLimit(req.scope, `ai:admin:${req.auth_context?.actor_id ?? "admin"}`)

  try {
    const product = await generateProductDraft({
      container: req.scope,
      image_urls,
      image_data_urls,
      source_url,
      hints,
      task: "admin_text",
    })
    res.json({ product })
  } catch (error) {
    if (!sendAiHttpError(error, res)) {
      throw error
    }
  }
}
