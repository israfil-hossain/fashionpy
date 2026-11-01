import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

import { MESSAGING_MODULE } from "../../../modules/messaging"
import type MessagingModuleService from "../../../modules/messaging/service"
import { ConversationType } from "../../../modules/messaging/types/common"

type ValidateChatBlockInput = {
  sender_id: string
  sender_type: "customer" | "seller" | "admin"
  recipient_id: string
  conversation_type: ConversationType
}

export const validateChatBlockStep = createStep(
  "validate-chat-block",
  async (input: ValidateChatBlockInput, { container }) => {
    // Chat blocks only govern buyer↔seller marketplace chat — a blocked
    // customer must still be able to reach marketplace support.
    if (input.conversation_type !== "marketplace" || input.sender_type === "admin") {
      return new StepResponse(undefined)
    }

    const service = container.resolve<MessagingModuleService>(MESSAGING_MODULE)

    const customerId =
      input.sender_type === "customer" ? input.sender_id : input.recipient_id
    const blocked = await service.checkBuyersBlocked([customerId])

    if (blocked.has(customerId)) {
      if (input.sender_type === "customer") {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Your chat access has been suspended"
        )
      } else {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Cannot send messages to a blocked customer"
        )
      }
    }

    return new StepResponse(undefined)
  }
)
