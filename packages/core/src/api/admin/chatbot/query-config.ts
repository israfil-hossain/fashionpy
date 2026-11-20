const adminChatbotConversationFields = [
  "id",
  "customer_id",
  "status",
  "locale",
  "last_message_preview",
  "last_message_at",
  "created_at",
]

export const adminChatbotConversationQueryConfig = {
  list: {
    defaults: adminChatbotConversationFields,
    isList: true,
  },
  retrieve: {
    defaults: adminChatbotConversationFields,
    isList: false,
  },
}
