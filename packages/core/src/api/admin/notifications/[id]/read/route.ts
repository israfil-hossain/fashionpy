import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { markNotificationRead } from "../../../../utils/notification-feed"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ notification: unknown }>
) => {
  await markNotificationRead(req, res, {
    recipient_type: "admin",
    recipient_id: req.auth_context.actor_id,
  })
}
