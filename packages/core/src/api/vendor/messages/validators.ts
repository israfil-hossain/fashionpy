import { z } from "zod"

export type VendorListConversationsType = z.infer<typeof VendorListConversations>
export const VendorListConversations = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  type: z.enum(["marketplace", "support_customer", "support_vendor"]).optional(),
})

export type VendorCreateSupportType = z.infer<typeof VendorCreateSupport>
export const VendorCreateSupport = z.object({
  body: z.string().min(1).max(2000).optional(),
  context_type: z.enum(["product", "order"]).optional().nullable(),
  context_id: z.string().optional().nullable(),
}).refine(
  (data) =>
    (!data.context_type && !data.context_id) ||
    (data.context_type && data.context_id),
  { message: "context_type and context_id must both be set or both be omitted" }
)

export type VendorGetMessagesType = z.infer<typeof VendorGetMessages>
export const VendorGetMessages = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
})

export type VendorSendReplyType = z.infer<typeof VendorSendReply>
export const VendorSendReply = z.object({
  body: z.string().min(1).max(2000),
})

export type VendorMarkReadType = z.infer<typeof VendorMarkRead>
export const VendorMarkRead = z.object({})
