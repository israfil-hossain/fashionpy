import { InjectManager, MedusaContext, MedusaService } from "@medusajs/framework/utils"
import { Context } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"

import { Conversation } from "./models/conversation"
import { Message } from "./models/message"
import { ChatBlock } from "./models/chat-block"
import {
  CursorPaginatedResult,
  ConversationDTO,
  MessageDTO,
  MessagingModuleOptions,
  ResolvedMessagingModuleOptions,
  MESSAGING_MODULE_OPTION_DEFAULTS,
} from "./types/common"

const TABLE_CONVERSATION = "conversation"
const TABLE_MESSAGE = "message"
const TABLE_CHAT_BLOCK = "chat_block"
const MAX_PREVIEW_LENGTH = 100

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

export function encodeCursor(values: Record<string, string | number | null>): string {
  return Buffer.from(JSON.stringify(values)).toString("base64url")
}

export function decodeCursor(cursor: string): Record<string, string | number | null> | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"))
  } catch {
    return null
  }
}

class MessagingModuleService extends MedusaService({
  Conversation,
  Message,
  ChatBlock,
}) {
  protected readonly options_: ResolvedMessagingModuleOptions

  constructor(_deps: unknown, options?: MessagingModuleOptions) {
    // @ts-ignore — MedusaService base accepts arbitrary constructor args
    super(...arguments)
    this.options_ = {
      rateLimits: {
        ...MESSAGING_MODULE_OPTION_DEFAULTS.rateLimits,
        ...(options?.rateLimits ?? {}),
      },
    }
  }

  getOptions(): ResolvedMessagingModuleOptions {
    return this.options_
  }

  @InjectManager()
  async checkBuyersBlocked(
    buyerIds: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<Set<string>> {
    if (buyerIds.length === 0) return new Set()
    const knex = sharedContext!.manager!.getKnex()
    const rows: { customer_id: string }[] = await knex(TABLE_CHAT_BLOCK)
      .select("customer_id")
      .whereIn("customer_id", buyerIds)
      .whereNull("deleted_at")
    return new Set(rows.map((r) => r.customer_id))
  }

  @InjectManager()
  async getBlockDetail(
    customerId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<{ blocked: boolean; reason: string | null }> {
    const knex = sharedContext!.manager!.getKnex()
    const row: { reason: string | null } | undefined = await knex(TABLE_CHAT_BLOCK)
      .select("reason")
      .where("customer_id", customerId)
      .whereNull("deleted_at")
      .first()

    return row
      ? { blocked: true, reason: row.reason }
      : { blocked: false, reason: null }
  }

  @InjectManager()
  async listConversationsCursor(
    filter: {
      buyer_id?: string
      seller_id?: string
      type?: ConversationDTO["type"] | ConversationDTO["type"][]
    },
    pagination: { cursor?: string | null; limit?: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<CursorPaginatedResult<ConversationDTO>> {
    const knex = sharedContext!.manager!.getKnex()
    const limit = Math.min(pagination.limit ?? 20, 50)

    let query = knex(TABLE_CONVERSATION)
      .select("*")
      .where("deleted_at", null)
      .orderByRaw("last_message_at DESC NULLS LAST, id DESC")
      .limit(limit + 1)

    if (filter.buyer_id) {
      query = query.where("buyer_id", filter.buyer_id)
    }

    if (filter.seller_id) {
      query = query.where("seller_id", filter.seller_id)
    }

    if (filter.type) {
      query = query.whereIn(
        "type",
        Array.isArray(filter.type) ? filter.type : [filter.type]
      )
    }

    if (pagination.cursor) {
      const decoded = decodeCursor(pagination.cursor)
      if (decoded && decoded.last_message_at && decoded.id) {
        query = query.where(function () {
          this.where("last_message_at", "<", decoded.last_message_at!)
            .orWhere(function () {
              this.where("last_message_at", "=", decoded.last_message_at!)
                .andWhere("id", "<", decoded.id!)
            })
        })
      }
    }

    const rows: any[] = await query

    const hasMore = rows.length > limit
    const data = hasMore ? rows.slice(0, limit) : rows

    let next_cursor: string | null = null
    if (hasMore && data.length > 0) {
      const lastRow = data[data.length - 1]
      next_cursor = encodeCursor({
        last_message_at: lastRow.last_message_at?.toISOString?.() ?? lastRow.last_message_at,
        id: lastRow.id,
      })
    }

    return { data, next_cursor }
  }

  @InjectManager()
  async listMessagesCursor(
    conversationId: string,
    pagination: { cursor?: string | null; limit?: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<CursorPaginatedResult<MessageDTO>> {
    const knex = sharedContext!.manager!.getKnex()
    const limit = Math.min(pagination.limit ?? 30, 100)

    let query = knex(TABLE_MESSAGE)
      .select("*")
      .where("conversation_id", conversationId)
      .where("deleted_at", null)
      .orderByRaw("created_at DESC, id DESC")
      .limit(limit + 1)

    if (pagination.cursor) {
      const decoded = decodeCursor(pagination.cursor)
      if (decoded && decoded.created_at && decoded.id) {
        query = query.where(function () {
          this.where("created_at", "<", decoded.created_at!)
            .orWhere(function () {
              this.where("created_at", "=", decoded.created_at!)
                .andWhere("id", "<", decoded.id!)
            })
        })
      }
    }

    const rows: any[] = await query

    const hasMore = rows.length > limit
    const data = hasMore ? rows.slice(0, limit) : rows

    let next_cursor: string | null = null
    if (hasMore && data.length > 0) {
      const lastRow = data[data.length - 1]
      next_cursor = encodeCursor({
        created_at: lastRow.created_at?.toISOString?.() ?? lastRow.created_at,
        id: lastRow.id,
      })
    }

    return { data, next_cursor }
  }

  /**
   * Cross-module admin search: joins conversation with seller + customer
   * tables via raw Knex for performance (avoids N+1 queries). This is
   * intentional — admin oversight requires denormalized data in a single
   * paginated query. Module isolation is preserved at the application
   * layer; this method is only used by the admin search route.
   */
  @InjectManager()
  async searchConversationsAdmin(
    filter: {
      seller_name?: string
      buyer_name?: string
      date_from?: string
      date_to?: string
      context_type?: string
      context_id?: string
      type?: ConversationDTO["type"] | ConversationDTO["type"][]
    },
    pagination: { cursor?: string | null; limit?: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<CursorPaginatedResult<ConversationDTO & { seller_name?: string; buyer_name?: string; buyer_email?: string; message_count?: number }>> {
    const knex = sharedContext!.manager!.getKnex()
    const limit = Math.min(pagination.limit ?? 20, 50)

    let query = knex(`${TABLE_CONVERSATION} as c`)
      .select(
        "c.*",
        "s.name as seller_name",
        "cust.first_name as buyer_first_name",
        "cust.last_name as buyer_last_name",
        "cust.email as buyer_email"
      )
      .leftJoin(
        "seller_seller_messaging_conversation as sc",
        "sc.conversation_id",
        "c.id"
      )
      .leftJoin("seller as s", "s.id", "sc.seller_id")
      .leftJoin(
        "customer_customer_messaging_conversation as cc",
        "cc.conversation_id",
        "c.id"
      )
      .leftJoin("customer as cust", "cust.id", "cc.customer_id")
      .where("c.deleted_at", null)
      .orderByRaw("c.last_message_at DESC NULLS LAST, c.id DESC")
      .limit(limit + 1)

    if (filter.type) {
      query = query.whereIn(
        "c.type",
        Array.isArray(filter.type) ? filter.type : [filter.type]
      )
    }

    if (filter.seller_name) {
      query = query.whereILike("s.name", `%${escapeLike(filter.seller_name)}%`)
    }

    if (filter.buyer_name) {
      const escaped = escapeLike(filter.buyer_name)
      query = query.where(function () {
        this.whereILike("cust.first_name", `%${escaped}%`)
          .orWhereILike("cust.last_name", `%${escaped}%`)
      })
    }

    if (filter.date_from) {
      query = query.where("c.last_message_at", ">=", filter.date_from)
    }

    if (filter.date_to) {
      query = query.where("c.last_message_at", "<=", filter.date_to)
    }

    if (filter.context_type || filter.context_id) {
      query = query.whereExists(function () {
        this.select(knex.raw("1"))
          .from(`${TABLE_MESSAGE} as m`)
          .whereRaw("m.conversation_id = c.id")

        if (filter.context_type) {
          this.where("m.context_type", filter.context_type)
        }
        if (filter.context_id) {
          this.where("m.context_id", filter.context_id)
        }
      })
    }

    if (pagination.cursor) {
      const decoded = decodeCursor(pagination.cursor)
      if (decoded && decoded.last_message_at && decoded.id) {
        query = query.where(function () {
          this.where("c.last_message_at", "<", decoded.last_message_at!)
            .orWhere(function () {
              this.where("c.last_message_at", "=", decoded.last_message_at!)
                .andWhere("c.id", "<", decoded.id!)
            })
        })
      }
    }

    const rows: any[] = await query

    const hasMore = rows.length > limit
    const data = (hasMore ? rows.slice(0, limit) : rows).map((row: any) => ({
      ...row,
      buyer_name: [row.buyer_first_name, row.buyer_last_name]
        .filter(Boolean)
        .join(" "),
    }))

    let next_cursor: string | null = null
    if (hasMore && data.length > 0) {
      const lastRow = data[data.length - 1]
      next_cursor = encodeCursor({
        last_message_at: lastRow.last_message_at?.toISOString?.() ?? lastRow.last_message_at,
        id: lastRow.id,
      })
    }

    return { data, next_cursor }
  }

  @InjectManager()
  async getUnreadCountTotal(
    filter: { buyer_id?: string; seller_id?: string; for_admin?: boolean },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<number> {
    const knex = sharedContext!.manager!.getKnex()

    const countField = filter.for_admin
      ? "unread_count_admin"
      : filter.buyer_id
        ? "unread_count_customer"
        : "unread_count_seller"

    let query = knex(TABLE_CONVERSATION)
      .sum({ total: countField })
      .where("deleted_at", null)

    if (filter.for_admin) {
      query = query.whereIn("type", ["support_customer", "support_vendor"])
    }

    if (filter.buyer_id) {
      query = query.where("buyer_id", filter.buyer_id)
    }

    if (filter.seller_id) {
      query = query.where("seller_id", filter.seller_id)
    }

    const [result] = await query

    return Number(result?.total ?? 0)
  }

  @InjectManager()
  async createMessageAtomic(
    data: {
      conversation_id: string
      sender_id: string
      sender_type: "customer" | "seller" | "admin"
      body: string
      context_type?: string | null
      context_id?: string | null
      context_label?: string | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<MessageDTO> {
    const knex = sharedContext!.manager!.getKnex()

    const preview = data.body.substring(0, MAX_PREVIEW_LENGTH)

    const now = new Date()

    return await knex.transaction(async (trx) => {
      const conversation: { type: ConversationDTO["type"] } | undefined =
        await trx(TABLE_CONVERSATION)
          .select("type")
          .where("id", data.conversation_id)
          .first()

      const recipientCounterField = resolveRecipientCounterField(
        conversation?.type ?? "marketplace",
        data.sender_type
      )

      const [message] = await trx(TABLE_MESSAGE)
        .insert({
          id: `msg_${generateId()}`,
          conversation_id: data.conversation_id,
          sender_id: data.sender_id,
          sender_type: data.sender_type,
          body: data.body,
          context_type: data.context_type ?? null,
          context_id: data.context_id ?? null,
          context_label: data.context_label ?? null,
          read_at: null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        })
        .returning("*")

      await trx(TABLE_CONVERSATION)
        .where("id", data.conversation_id)
        .update({
          last_message_preview: preview,
          last_message_sender_type: data.sender_type,
          last_message_at: now,
          [recipientCounterField]: knex.raw(`?? + 1`, [recipientCounterField]),
          updated_at: now,
        })

      return message
    })
  }

  @InjectManager()
  async markMessagesReadAtomic(
    conversationId: string,
    readerType: "customer" | "seller" | "admin",
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<number> {
    const knex = sharedContext!.manager!.getKnex()

    const now = new Date()

    return await knex.transaction(async (trx) => {
      const conversation: { type: ConversationDTO["type"] } | undefined =
        await trx(TABLE_CONVERSATION)
          .select("type")
          .where("id", conversationId)
          .first()

      const { senderTypesToMark, counterField } = resolveReadTargets(
        conversation?.type ?? "marketplace",
        readerType
      )

      const updated = await trx(TABLE_MESSAGE)
        .where("conversation_id", conversationId)
        .whereIn("sender_type", senderTypesToMark)
        .whereNull("read_at")
        .whereNull("deleted_at")
        .update({
          read_at: now,
          updated_at: now,
        })

      await trx(TABLE_CONVERSATION)
        .where("id", conversationId)
        .update({
          [counterField]: 0,
          updated_at: now,
        })

      return updated
    })
  }
}

/**
 * Which conversation side's counter a message bumps, per thread type.
 * Support threads route customer/seller messages to the shared admin counter;
 * admin replies land on the other side's counter.
 */
export function resolveRecipientCounterField(
  type: ConversationDTO["type"],
  senderType: "customer" | "seller" | "admin"
): "unread_count_customer" | "unread_count_seller" | "unread_count_admin" {
  if (senderType === "admin") {
    return type === "support_customer"
      ? "unread_count_customer"
      : "unread_count_seller"
  }

  // marketplace: customer↔seller. support threads: the participant messages
  // the shared admin inbox.
  if (type === "support_customer") return "unread_count_admin"
  if (type === "support_vendor") return "unread_count_admin"

  return senderType === "customer"
    ? "unread_count_seller"
    : "unread_count_customer"
}

/**
 * Which senders' messages a reader marks read, and which counter resets.
 * Admin reading a support thread marks both human sides' messages.
 */
export function resolveReadTargets(
  type: ConversationDTO["type"],
  readerType: "customer" | "seller" | "admin"
): {
  senderTypesToMark: ("customer" | "seller" | "admin")[]
  counterField: "unread_count_customer" | "unread_count_seller" | "unread_count_admin"
} {
  switch (readerType) {
    case "admin":
      return {
        senderTypesToMark: ["customer", "seller"],
        counterField: "unread_count_admin",
      }
    case "customer":
      return {
        senderTypesToMark:
          type === "support_customer" ? ["admin"] : ["seller"],
        counterField: "unread_count_customer",
      }
    case "seller":
      return {
        senderTypesToMark: type === "support_vendor" ? ["admin"] : ["customer"],
        counterField: "unread_count_seller",
      }
  }
}

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 16)
}

export default MessagingModuleService
