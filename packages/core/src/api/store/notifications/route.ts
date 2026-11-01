import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { NotificationFeedListResponse } from "@mercurjs/types"

import { StoreGetNotificationFeedParamsType } from "./validators"
import { listNotificationFeed } from "../../utils/notification-feed"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetNotificationFeedParamsType>,
  res: MedusaResponse<NotificationFeedListResponse>
) => {
  await listNotificationFeed(req, res, {
    recipient_type: "customer",
    recipient_id: req.auth_context.actor_id,
  })
}
