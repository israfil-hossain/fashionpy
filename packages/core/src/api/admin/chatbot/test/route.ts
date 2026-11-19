import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { testConnection } from "../../../../chatbot/agent"
import { AdminTestChatbotType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminTestChatbotType>,
  res: MedusaResponse
) => {
  try {
    const result = await testConnection(req.scope, req.validatedBody ?? {})
    if (!result.ok) {
      res.status(502).json(result)
      return
    }
    res.json(result)
  } catch (err) {
    res.status(502).json({
      ok: false,
      provider: "unknown",
      model: "",
      latency_ms: 0,
      error: (err as Error).message,
    })
  }
}
