import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CHATBOT_MODULE } from "../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../modules/chatbot/service"
import { AdminUpdateChatbotSettingsType } from "../validators"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const settings = await service.getSettings()
  res.json({ settings })
}

export const PUT = async (
  req: AuthenticatedMedusaRequest<AdminUpdateChatbotSettingsType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const settings = await service.updateSettings(req.validatedBody)
  res.json({ settings })
}
