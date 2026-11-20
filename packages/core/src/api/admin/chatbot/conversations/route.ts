import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { CHATBOT_MODULE } from "../../../../modules/chatbot"
import type ChatbotModuleService from "../../../../modules/chatbot/service"

async function resolveCustomers(
  req: AuthenticatedMedusaRequest,
  ids: string[]
): Promise<Map<string, HttpTypes.AdminChatbotCustomerRef>> {
  const byId = new Map<string, HttpTypes.AdminChatbotCustomerRef>()
  if (!ids.length) {
    return byId
  }
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name", "last_name", "email", "phone"],
      filters: { id: ids },
      pagination: { take: 100 },
    })
    for (const row of data ?? []) {
      byId.set(row.id as string, row as HttpTypes.AdminChatbotCustomerRef)
    }
  } catch {
    // Enrichment is best-effort — the list still renders without names.
  }
  return byId
}

/** Admin inbox list — every conversation, newest activity first. */
export const GET = async (
  req: AuthenticatedMedusaRequest<never>,
  res: MedusaResponse<HttpTypes.AdminChatbotConversationListResponse>
) => {
  const service = req.scope.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { q, status } = req.filterableFields as {
    q?: string
    status?: "open" | "closed"
  }
  const { skip = 0, take = 20 } = req.queryConfig.pagination ?? {}

  // `q` matches customer names/emails (resolved here) OR the last-message
  // preview — guests have no customer row, so both sides must be searchable.
  let customerIds: string[] | undefined
  if (q) {
    try {
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id"],
        filters: {
          $or: [
            { first_name: { $ilike: `%${q}%` } },
            { last_name: { $ilike: `%${q}%` } },
            { email: { $ilike: `%${q}%` } },
          ],
        },
        pagination: { take: 100 },
      })
      customerIds = (customers ?? []).map((c) => c.id as string)
    } catch {
      customerIds = []
    }
  }

  const { conversations, count } = await service.listConversationsForAdmin({
    ...(status ? { status } : {}),
    ...(q ? { customer_ids: customerIds ?? [], preview_like: q } : {}),
    skip,
    take,
  })

  const boundIds = [
    ...new Set(
      conversations
        .map((c) => c.customer_id)
        .filter((id): id is string => typeof id === "string" && !!id)
    ),
  ]
  const customersById = await resolveCustomers(req, boundIds)

  res.json({
    conversations: conversations.map((c) => ({
      ...c,
      customer: c.customer_id
        ? (customersById.get(c.customer_id) ?? null)
        : null,
    })),
    count,
    offset: skip,
    limit: take,
  })
}
