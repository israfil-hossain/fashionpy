import { z } from "zod"

import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type StoreGetReviewsParamsType = z.infer<typeof StoreGetReviewsParams>
export const StoreGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  // Public listing filters (product/seller review pages). When either is
  // present the route returns published reviews for that reference without
  // customer scoping. Absent → personal "my reviews" list (auth required).
  product_id: z.union([z.string(), z.array(z.string())]).optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  reference: z.enum(["product", "seller"]).optional(),
  status: z
    .union([
      z.enum(["pending", "published", "rejected"]),
      z.array(z.enum(["pending", "published", "rejected"])),
    ])
    .optional(),
})

export type StoreCreateReviewType = z.infer<typeof StoreCreateReview>
export const StoreCreateReview = z.object({
  order_id: z.string(),
  reference: z.enum(["seller", "product"]),
  reference_id: z.string(),
  rating: z.number().int().min(1).max(5),
  customer_note: z.string().max(300).nullish(),
})

export type StoreUpdateReviewType = z.infer<typeof StoreUpdateReview>
export const StoreUpdateReview = z.object({
  rating: z.number().int().min(1).max(5),
  customer_note: z.string().max(300).nullish(),
})
