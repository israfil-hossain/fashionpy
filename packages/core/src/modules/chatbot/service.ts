import { InjectManager, MedusaContext, MedusaService } from "@medusajs/framework/utils"
import { Context } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"

import { ChatbotConversation } from "./models/chatbot-conversation"
import { ChatbotMessage } from "./models/chatbot-message"
import { ChatbotSettings } from "./models/chatbot-settings"
import {
  CHATBOT_SETTINGS_ID,
  ChatbotConversationDTO,
  ChatbotLocale,
  ChatbotMessageDTO,
  ChatbotSettingsDTO,
  ChatbotSettingsInput,
} from "./types/common"
import { encryptSecret, decryptSecret } from "./crypto"

const DEFAULT_SYSTEM_PROMPT = `You are a helpful marketplace shopping assistant for a Bangladeshi ecommerce store.
You help customers find products, place orders, and check order/delivery status.
Reply in the same language the customer uses (Bangla or English).
Keep replies short and friendly. When you find products, call search_products and surface product cards.
Never invent prices or stock. Only place an order after the customer explicitly confirms the review summary.`

class ChatbotModuleService extends MedusaService({
  ChatbotConversation,
  ChatbotMessage,
  ChatbotSettings,
}) {
  @InjectManager()
  async getSettings(
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<ChatbotSettingsDTO> {
    const knex = sharedContext!.manager!.getKnex()
    const row = await knex("chatbot_settings")
      .where("id", CHATBOT_SETTINGS_ID)
      .first()

    if (!row) {
      return {
        enabled: false,
        provider: "openrouter",
        base_url: null,
        model: null,
        stt_provider: "none",
        stt_model: null,
        system_prompt: null,
        temperature: 0.4,
        max_tokens: 1024,
        api_key_set: false,
        stt_api_key_set: false,
      }
    }

    return {
      enabled: !!row.enabled,
      provider: row.provider ?? "openrouter",
      base_url: row.base_url ?? null,
      model: row.model ?? null,
      stt_provider: row.stt_provider ?? "none",
      stt_model: row.stt_model ?? null,
      system_prompt: row.system_prompt ?? null,
      temperature: row.temperature ?? 0.4,
      max_tokens: row.max_tokens ?? 1024,
      api_key_set: !!row.api_key_encrypted,
      stt_api_key_set: !!row.stt_api_key_encrypted,
    }
  }

  @InjectManager()
  async updateSettings(
    input: ChatbotSettingsInput,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<ChatbotSettingsDTO> {
    const knex = sharedContext!.manager!.getKnex()
    const existing = await knex("chatbot_settings")
      .where("id", CHATBOT_SETTINGS_ID)
      .first()

    const patch: Record<string, unknown> = {
      id: CHATBOT_SETTINGS_ID,
      enabled: input.enabled ?? existing?.enabled ?? false,
      provider: input.provider ?? existing?.provider ?? "openrouter",
      base_url:
        input.base_url !== undefined
          ? input.base_url || null
          : (existing?.base_url ?? null),
      model: input.model !== undefined ? input.model || null : (existing?.model ?? null),
      stt_provider: input.stt_provider ?? existing?.stt_provider ?? "none",
      stt_model:
        input.stt_model !== undefined
          ? input.stt_model || null
          : (existing?.stt_model ?? null),
      system_prompt:
        input.system_prompt !== undefined
          ? input.system_prompt || null
          : (existing?.system_prompt ?? null),
      temperature: input.temperature ?? existing?.temperature ?? 0.4,
      max_tokens: input.max_tokens ?? existing?.max_tokens ?? 1024,
    }

    if (input.api_key) {
      patch.api_key_encrypted = encryptSecret(input.api_key)
    } else if (input.api_key === null) {
      patch.api_key_encrypted = null
    } else {
      patch.api_key_encrypted = existing?.api_key_encrypted ?? null
    }

    if (input.stt_api_key) {
      patch.stt_api_key_encrypted = encryptSecret(input.stt_api_key)
    } else if (input.stt_api_key === null) {
      patch.stt_api_key_encrypted = null
    } else {
      patch.stt_api_key_encrypted = existing?.stt_api_key_encrypted ?? null
    }

    if (existing) {
      await knex("chatbot_settings")
        .where("id", CHATBOT_SETTINGS_ID)
        .update({
          ...patch,
          updated_at: knex.fn.now(),
        })
    } else {
      await knex("chatbot_settings").insert({
        ...patch,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
    }

    return this.getSettings(sharedContext)
  }

  /** Decrypted secrets for the agent runtime only — never exposed over HTTP. */
  @InjectManager()
  async getRuntimeSettings(
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<
    ChatbotSettingsDTO & {
      api_key: string | null
      stt_api_key: string | null
      system_prompt_effective: string
    }
  > {
    const knex = sharedContext!.manager!.getKnex()
    const row = await knex("chatbot_settings")
      .where("id", CHATBOT_SETTINGS_ID)
      .first()

    const base = await this.getSettings(sharedContext)
    return {
      ...base,
      api_key: row?.api_key_encrypted
        ? decryptSecret(row.api_key_encrypted)
        : null,
      stt_api_key: row?.stt_api_key_encrypted
        ? decryptSecret(row.stt_api_key_encrypted)
        : null,
      system_prompt_effective:
        (row?.system_prompt as string | null) || DEFAULT_SYSTEM_PROMPT,
    }
  }

  @InjectManager()
  async findOrCreateConversation(
    input: {
      customer_id?: string | null
      guest_token?: string | null
      locale?: ChatbotLocale
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<ChatbotConversationDTO> {
    const knex = sharedContext!.manager!.getKnex()

    let query = knex("chatbot_conversation")
      .where("status", "open")
      .whereNull("deleted_at")

    if (input.customer_id) {
      query = query.where("customer_id", input.customer_id)
    } else if (input.guest_token) {
      query = query
        .whereNull("customer_id")
        .where("guest_token", input.guest_token)
    } else {
      throw new Error("customer_id or guest_token required")
    }

    const existing = await query.orderBy("last_message_at", "desc").first()
    if (existing) {
      return existing as ChatbotConversationDTO
    }

    const id = `bconv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    const row = {
      id,
      customer_id: input.customer_id ?? null,
      guest_token: input.customer_id ? null : (input.guest_token ?? null),
      status: "open",
      locale: input.locale ?? "en",
      checkout_state: null,
      last_message_preview: null,
      last_message_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }
    await knex("chatbot_conversation").insert(row)
    return row as unknown as ChatbotConversationDTO
  }

  @InjectManager()
  async listConversations(
    filter: { customer_id: string; limit?: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<ChatbotConversationDTO[]> {
    const knex = sharedContext!.manager!.getKnex()
    return (await knex("chatbot_conversation")
      .where("customer_id", filter.customer_id)
      .whereNull("deleted_at")
      .orderBy("last_message_at", "desc")
      .limit(Math.min(filter.limit ?? 20, 50))) as ChatbotConversationDTO[]
  }

  /**
   * Admin inbox listing (SPEC-011): every conversation, newest activity
   * first, filterable by status and by either side of `q` — the caller
   * resolves `q` against customer names into `customer_ids` and also searches
   * the last-message preview (guests have no customer row to match).
   */
  @InjectManager()
  async listConversationsForAdmin(
    filter: {
      status?: "open" | "closed"
      customer_ids?: string[]
      preview_like?: string
      skip?: number
      take?: number
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<{ conversations: ChatbotConversationDTO[]; count: number }> {
    const knex = sharedContext!.manager!.getKnex()

    const applyFilters = () => {
      const query = knex("chatbot_conversation").whereNull("deleted_at")
      if (filter.status) {
        query.where("status", filter.status)
      }
      const hasCustomerFilter = filter.customer_ids !== undefined
      const hasPreviewFilter = !!filter.preview_like
      if (hasCustomerFilter || hasPreviewFilter) {
        query.andWhere(function (this: any) {
          if (hasCustomerFilter) {
            this.whereIn("customer_id", filter.customer_ids ?? [])
          }
          if (hasPreviewFilter) {
            this.orWhere(
              "last_message_preview",
              "ilike",
              `%${filter.preview_like}%`
            )
          }
        })
      }
      return query
    }

    const countRow = await applyFilters().count("* as c").first()
    const conversations = (await applyFilters()
      .orderBy("last_message_at", "desc")
      .orderBy("created_at", "desc")
      .offset(Math.max(filter.skip ?? 0, 0))
      .limit(Math.min(filter.take ?? 20, 100))) as ChatbotConversationDTO[]

    return {
      conversations,
      count: Number(
        (countRow as { c?: string | number } | undefined)?.c ?? 0
      ),
    }
  }

  @InjectManager()
  async getConversation(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<ChatbotConversationDTO | null> {
    const knex = sharedContext!.manager!.getKnex()
    const row = await knex("chatbot_conversation")
      .where("id", id)
      .whereNull("deleted_at")
      .first()
    return (row as ChatbotConversationDTO) ?? null
  }

  @InjectManager()
  async updateCheckoutState(
    id: string,
    state: ChatbotConversationDTO["checkout_state"],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    const knex = sharedContext!.manager!.getKnex()
    await knex("chatbot_conversation")
      .where("id", id)
      .update({
        checkout_state: state as never,
        updated_at: knex.fn.now(),
      })
  }

  @InjectManager()
  async updateLocale(
    id: string,
    locale: ChatbotLocale,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    const knex = sharedContext!.manager!.getKnex()
    await knex("chatbot_conversation")
      .where("id", id)
      .update({ locale, updated_at: knex.fn.now() })
  }

  @InjectManager()
  async appendMessage(
    input: {
      conversation_id: string
      role: "user" | "assistant" | "tool"
      content: string
      cards?: unknown
      tool_name?: string | null
      locale?: ChatbotLocale | null
      preview?: string | null
      sender?: "ai" | "admin" | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<ChatbotMessageDTO> {
    const knex = sharedContext!.manager!.getKnex()
    const id = `bmsg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    const now = new Date()
    const row = {
      id,
      conversation_id: input.conversation_id,
      role: input.role,
      content: input.content,
      cards: (input.cards as never) ?? null,
      tool_name: input.tool_name ?? null,
      locale: input.locale ?? null,
      sender: input.sender ?? null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }
    await knex("chatbot_message").insert(row)

    const preview =
      input.preview ??
      (input.role === "user"
        ? input.content.slice(0, 100)
        : undefined)

    if (preview !== undefined && preview !== null) {
      await knex("chatbot_conversation")
        .where("id", input.conversation_id)
        .update({
          last_message_preview: preview,
          last_message_at: now,
          updated_at: knex.fn.now(),
        })
    }

    return row as unknown as ChatbotMessageDTO
  }

  @InjectManager()
  async listMessages(
    conversationId: string,
    opts: { limit?: number } = {},
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<ChatbotMessageDTO[]> {
    const knex = sharedContext!.manager!.getKnex()
    return (await knex("chatbot_message")
      .where("conversation_id", conversationId)
      .whereNull("deleted_at")
      .orderBy("created_at", "asc")
      .limit(Math.min(opts.limit ?? 100, 200))) as ChatbotMessageDTO[]
  }

  @InjectManager()
  async touchConversation(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<void> {
    const knex = sharedContext!.manager!.getKnex()
    await knex("chatbot_conversation")
      .where("id", id)
      .update({ updated_at: knex.fn.now() })
  }
}

export default ChatbotModuleService
