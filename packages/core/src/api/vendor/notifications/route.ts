import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { NotificationFeedListResponse } from "@mercurjs/types"

import { VendorGetNotificationFeedParamsType } from "./validators"
import { listNotificationFeed } from "../../utils/notification-feed"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetNotificationFeedParamsType>,
  res: MedusaResponse<NotificationFeedListResponse>
) => {
  await listNotificationFeed(req, res, {
    recipient_type: "vendor",
    recipient_id: req.seller_context!.seller_member.member_id,
    seller_id: req.seller_context!.seller_id,
  })
}
