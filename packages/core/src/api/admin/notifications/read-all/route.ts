import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { markAllNotificationsRead } from "../../../utils/notification-feed"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ count: number }>
) => {
  await markAllNotificationsRead(req, res, {
    recipient_type: "admin",
    recipient_id: req.auth_context.actor_id,
  })
}
