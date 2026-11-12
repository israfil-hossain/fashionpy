import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetPayoutParamsType = z.infer<typeof AdminGetPayoutParams>
export const AdminGetPayoutParams = createSelectParams()

export type AdminGetPayoutsParamsType = z.infer<typeof AdminGetPayoutsParams>
export const AdminGetPayoutsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    account_id: z.union([z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    order_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type AdminMarkPayoutPaidType = z.infer<typeof AdminMarkPayoutPaid>
export const AdminMarkPayoutPaid = z
  .object({
    /** Your bank/wallet transaction reference for the manual transfer. */
    reference: z.string().trim().max(255).optional(),
  })
  .strict()

export type AdminBulkMarkPayoutPaidType = z.infer<typeof AdminBulkMarkPayoutPaid>
export const AdminBulkMarkPayoutPaid = z
  .object({
    ids: z.array(z.string()).min(1).max(200),
    reference: z.string().trim().max(255).optional(),
  })
  .strict()

export type AdminExportPayoutsType = z.infer<typeof AdminExportPayouts>
export const AdminExportPayouts = z
  .object({
    status: z.string().optional(),
    account_id: z.string().optional(),
    seller_id: z.string().optional(),
    limit: z.number().int().min(1).max(5000).optional(),
  })
  .strict()
