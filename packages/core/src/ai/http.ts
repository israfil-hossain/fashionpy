import type { MedusaResponse } from "@medusajs/framework/http"

import { ScrapeError } from "../utils/scrape/fetch-html"

/**
 * Map the AI layer's expected input failures (bad URL, unreachable image) to
 * the status the client should see. Returns false when the caller should
 * rethrow so Medusa's default error handling takes over.
 */
export function sendAiHttpError(error: unknown, res: MedusaResponse): boolean {
  if (error instanceof ScrapeError) {
    res.status(error.statusCode).json({ message: error.message })
    return true
  }
  return false
}
