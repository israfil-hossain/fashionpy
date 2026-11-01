import { z } from "zod"

export type AdminScrapeProductBodyType = z.infer<typeof AdminScrapeProductBody>

export const AdminScrapeProductBody = z
  .object({
    url: z.string().url(),
  })
  .strict()
