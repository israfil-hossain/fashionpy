import { z } from "zod"

export type AdminSearchConversationsType = z.infer<typeof AdminSearchConversations>
export const AdminSearchConversations = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  seller_name: z.string().optional(),
  buyer_name: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  context_type: z.enum(["product", "order"]).optional(),
  context_id: z.string().optional(),
  type: z.enum(["marketplace", "support_customer", "support_vendor"]).optional(),
})

export type AdminGetMessagesType = z.infer<typeof AdminGetMessages>
export const AdminGetMessages = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
})

export type AdminSendMessageType = z.infer<typeof AdminSendMessage>
export const AdminSendMessage = z.object({
  body: z.string().min(1).max(2000),
})

export type AdminMarkReadType = z.infer<typeof AdminMarkRead>
export const AdminMarkRead = z.object({})

export type AdminBlockCustomerType = z.infer<typeof AdminBlockCustomer>
export const AdminBlockCustomer = z.object({
  customer_id: z.string().min(1),
  reason: z.string().max(500).optional(),
})
