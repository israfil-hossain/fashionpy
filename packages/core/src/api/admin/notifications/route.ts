import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { NotificationFeedListResponse } from "@mercurjs/types"

import { AdminGetNotificationFeedParamsType } from "./validators"
import { listNotificationFeed } from "../../utils/notification-feed"

/**
 * Overrides Medusa's built-in GET /admin/notifications (which reads the
 * provider-oriented `notification` table) with the marketplace's in-app feed,
 * scoped to the authenticated operator.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetNotificationFeedParamsType>,
  res: MedusaResponse<NotificationFeedListResponse>
) => {
  await listNotificationFeed(req, res, {
    recipient_type: "admin",
    recipient_id: req.auth_context.actor_id,
  })
}
