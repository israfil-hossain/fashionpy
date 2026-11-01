import { z } from "zod"

export type VendorScrapeProductBodyType = z.infer<typeof VendorScrapeProductBody>

export const VendorScrapeProductBody = z
  .object({
    url: z.string().url(),
  })
  .strict()
