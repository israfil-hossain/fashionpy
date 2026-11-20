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
      // `message` mirrors `error` so API clients that surface `message`
      // (the admin fetchQuery) show the real provider reason, not a
      // generic status line.
      res.status(502).json({ ...result, message: result.error ?? "Connection failed" })
      return
    }
    res.json(result)
  } catch (err) {
    const message = (err as Error).message
    res.status(502).json({
      ok: false,
      provider: "unknown",
      model: "",
      latency_ms: 0,
      error: message,
      message,
    })
  }
}
