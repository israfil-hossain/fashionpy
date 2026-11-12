import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetCourierShipmentsParamsType = z.infer<
  typeof AdminGetCourierShipmentsParams
>
export const AdminGetCourierShipmentsParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(
  z.object({
    order_id: z.string().optional(),
    fulfillment_id: z.string().optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

export type AdminGetCourierShipmentParamsType = z.infer<
  typeof AdminGetCourierShipmentParams
>
export const AdminGetCourierShipmentParams = createSelectParams()

export type AdminMarkCodRemittedType = z.infer<typeof AdminMarkCodRemitted>
export const AdminMarkCodRemitted = z
  .object({
    /** Defaults to now. */
    remitted_at: z.coerce.date().optional(),
    /** Courier remittance batch / transfer reference. */
    reference: z.string().trim().max(255).optional(),
  })
  .strict()
