import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type StoreGetNotificationFeedParamsType = z.infer<
  typeof StoreGetNotificationFeedParams
>
export const StoreGetNotificationFeedParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    unread: booleanString().optional(),
    event: z.string().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
