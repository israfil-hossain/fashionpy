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
    recipient_type: "vendor",
    recipient_id: req.seller_context!.seller_member.member_id,
    seller_id: req.seller_context!.seller_id,
  })
}
