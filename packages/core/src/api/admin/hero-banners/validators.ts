import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type AdminGetHeroBannerParamsType = z.infer<
  typeof AdminGetHeroBannerParams
>
export const AdminGetHeroBannerParams = createSelectParams()

export type AdminGetHeroBannersParamsType = z.infer<
  typeof AdminGetHeroBannersParams
>
export const AdminGetHeroBannersParams = createFindParams({
  offset: 0,
  limit: 50,
  order: "rank",
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    is_active: booleanString().optional(),
    slot: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type AdminCreateHeroBannerType = z.infer<typeof AdminCreateHeroBanner>
export const AdminCreateHeroBanner = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    image_url: z.string().url(),
    cta_text: z.string().nullable().optional(),
    cta_link: z.string().nullable().optional(),
    text_position: z.enum(["left", "center", "right"]).optional(),
    slot: z.enum(["hero", "company_1", "company_2", "offer_price"]).optional(),
    is_active: z.boolean().optional(),
    rank: z.number().int().min(0).optional(),
    starts_at: z.coerce.date().nullable().optional(),
    ends_at: z.coerce.date().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict()

export type AdminUpdateHeroBannerType = z.infer<typeof AdminUpdateHeroBanner>
export const AdminUpdateHeroBanner = z
  .object({
    title: z.string().min(1).optional(),
    subtitle: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    image_url: z.string().url().optional(),
    cta_text: z.string().nullable().optional(),
    cta_link: z.string().nullable().optional(),
    text_position: z.enum(["left", "center", "right"]).optional(),
    slot: z.enum(["hero", "company_1", "company_2", "offer_price"]).optional(),
    is_active: z.boolean().optional(),
    rank: z.number().int().min(0).optional(),
    starts_at: z.coerce.date().nullable().optional(),
    ends_at: z.coerce.date().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict()
