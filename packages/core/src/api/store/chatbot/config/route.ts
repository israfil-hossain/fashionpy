import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { CHATBOT_MODULE } from "../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../modules/chatbot/service"

/** Public widget config — no secrets. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  try {
    const settings = await service.getSettings()
    res.json({
      enabled: settings.enabled,
      locale_default: "en",
    })
  } catch {
    res.json({ enabled: false, locale_default: "en" })
  }
}
