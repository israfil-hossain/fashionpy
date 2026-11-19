import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { runAgent, AgentEvent } from "../../../../../../chatbot/agent"
import { CHATBOT_MODULE } from "../../../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../../../modules/chatbot/service"
import { StoreSendChatbotMessageType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreSendChatbotMessageType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const conversationId = req.params.id!
  const conversation = await service.getConversation(conversationId)

  if (!conversation) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  const customerId = req.auth_context?.actor_id ?? null
  if (
    conversation.customer_id &&
    customerId &&
    conversation.customer_id !== customerId
  ) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  const stream = req.query.stream !== "false"
  const { content } = req.validatedBody

  if (!stream) {
    try {
      const result = await runAgent({
        container: req.scope,
        conversation_id: conversationId,
        customer_id: customerId,
        user_content: content,
        locale: conversation.locale ?? "en",
      })
      res.json(result)
    } catch (err) {
      res.status(400).json({ error: (err as Error).message })
    }
    return
  }

  // SSE reply
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  })
  res.flushHeaders()

  const writeEvent = (event: AgentEvent) => {
    res.write(`event: ${event.type}\n`)
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  try {
    await runAgent({
      container: req.scope,
      conversation_id: conversationId,
      customer_id: customerId,
      user_content: content,
      locale: conversation.locale ?? "en",
      onEvent: writeEvent,
    })
  } catch (err) {
    writeEvent({ type: "error", error: (err as Error).message })
  } finally {
    res.end()
  }
}
