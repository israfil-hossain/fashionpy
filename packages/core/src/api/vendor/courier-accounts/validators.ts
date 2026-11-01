import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetCourierAccountParamsType = z.infer<
  typeof VendorGetCourierAccountParams
>
export const VendorGetCourierAccountParams = createSelectParams()

export type VendorGetCourierAccountsParamsType = z.infer<
  typeof VendorGetCourierAccountsParams
>
export const VendorGetCourierAccountsParams = createFindParams({
  limit: 20,
  offset: 0,
})

export type VendorCreateCourierAccountType = z.infer<
  typeof VendorCreateCourierAccount
>
export const VendorCreateCourierAccount = z
  .object({
    provider: z.enum(["pathao", "steadfast"]),
    data: z.record(z.string(), z.unknown()),
    cod_enabled: z.boolean().optional(),
  })
  .strict()

export type VendorUpdateCourierAccountType = z.infer<
  typeof VendorUpdateCourierAccount
>
export const VendorUpdateCourierAccount = z
  .object({
    data: z.record(z.string(), z.unknown()).optional(),
    cod_enabled: z.boolean().optional(),
  })
  .strict()
