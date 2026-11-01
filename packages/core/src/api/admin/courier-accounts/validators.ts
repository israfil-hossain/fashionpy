import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetCourierAccountsParamsType = z.infer<
  typeof AdminGetCourierAccountsParams
>
export const AdminGetCourierAccountsParams = createFindParams({
  limit: 50,
  offset: 0,
})

export type AdminGetCourierAccountParamsType = z.infer<
  typeof AdminGetCourierAccountParams
>
export const AdminGetCourierAccountParams = createSelectParams()

/**
 * Upserts the PLATFORM courier account (seller_id = NULL) — used for COD
 * bookings so cash is collected on FashionPy's account.
 */
export type AdminCreateCourierAccountType = z.infer<
  typeof AdminCreateCourierAccount
>
export const AdminCreateCourierAccount = z
  .object({
    provider: z.enum(["pathao", "steadfast"]),
    data: z.record(z.string(), z.unknown()),
    cod_enabled: z.boolean().optional(),
  })
  .strict()
