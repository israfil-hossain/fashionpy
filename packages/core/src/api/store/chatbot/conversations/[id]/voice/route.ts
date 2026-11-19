import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { runAgent } from "../../../../../../chatbot/agent"
import { transcribeAudio } from "../../../../../../chatbot/stt"
import { CHATBOT_MODULE } from "../../../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../../../modules/chatbot/service"
import { StoreChatbotVoiceType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreChatbotVoiceType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const conversationId = req.params.id!
  const conversation = await service.getConversation(conversationId)

  if (!conversation) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Conversation not found")
  }

  const customerId = req.auth_context?.actor_id ?? null
  const { audio_base64, mime_type } = req.validatedBody

  let transcript: string
  try {
    transcript = await transcribeAudio(req.scope, {
      base64: audio_base64,
      mime_type,
    })
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
    return
  }

  if (!transcript.trim()) {
    res.status(400).json({ error: "Could not transcribe audio" })
    return
  }

  const stream = req.query.stream !== "false"

  if (!stream) {
    try {
      const result = await runAgent({
        container: req.scope,
        conversation_id: conversationId,
        customer_id: customerId,
        user_content: transcript,
        locale: conversation.locale ?? "en",
      })
      res.json({ transcript, ...result })
    } catch (err) {
      res.status(400).json({ transcript, error: (err as Error).message })
    }
    return
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  })
  res.flushHeaders()
  res.write(`event: transcript\ndata: ${JSON.stringify({ text: transcript })}\n\n`)

  try {
    await runAgent({
      container: req.scope,
      conversation_id: conversationId,
      customer_id: customerId,
      user_content: transcript,
      locale: conversation.locale ?? "en",
      onEvent: (event) => {
        res.write(`event: ${event.type}\n`)
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      },
    })
  } catch (err) {
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`
    )
  } finally {
    res.end()
  }
}
