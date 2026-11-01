import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { scrapeProduct, ScrapeError } from "../../../../utils/scrape"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { url } = req.validatedBody as { url: string }

  try {
    const draft = await scrapeProduct(url)
    res.json({ product: draft })
  } catch (error) {
    if (error instanceof ScrapeError) {
      res.status(error.statusCode).json({ message: error.message })
      return
    }
    throw error
  }
}
