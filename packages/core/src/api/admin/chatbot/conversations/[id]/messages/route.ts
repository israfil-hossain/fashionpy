import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { fanOutNotification } from "../../../../../../utils/fan-out-notification"
import { NotificationAudience } from "../../../../../../modules/notification/models"
import { CHATBOT_MODULE } from "../../../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../../../modules/chatbot/service"
import type { AdminSendChatbotMessageType } from "../../../validators"

/**
 * Admin follow-up send (SPEC-011): appended as an assistant message with
 * `sender: "admin"` and fanned out to the customer's in-app notification
 * feed (bell → `/?chat=1` → widget opens with history).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSendChatbotMessageType>,
  res: MedusaResponse<HttpTypes.AdminChatbotSendMessageResponse>
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const conversation = await service.getConversation(req.params.id!)
  if (!conversation) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  const { content } = req.validatedBody

  const message = await service.appendMessage({
    conversation_id: conversation.id,
    role: "assistant",
    sender: "admin",
    content,
    locale: conversation.locale,
    preview: content.slice(0, 100),
  })

  // Guests (legacy rows) have no feed to notify — the inbox still shows it.
  if (conversation.customer_id) {
    const bn = conversation.locale === "bn"
    try {
      await fanOutNotification(req.scope, {
        audience: NotificationAudience.CUSTOMER,
        customer_id: conversation.customer_id,
        event: "chatbot.followup",
        title: bn
          ? "ফ্যাশনপাই থেকে নতুন বার্তা"
          : "New message from FashionPy",
        body: content.slice(0, 140),
        link: "/?chat=1",
        resource_type: "chatbot_conversation",
        resource_id: conversation.id,
      })
    } catch {
      // The message is persisted — a feed hiccup must not fail the send.
    }
  }

  res.status(201).json({ message })
}
