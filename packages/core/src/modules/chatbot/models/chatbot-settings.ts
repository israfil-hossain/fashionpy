import { model } from "@medusajs/framework/utils"

/**
 * Singleton row (id fixed) holding the operator-configured AI provider.
 * Secrets are stored encrypted and never returned by the admin GET.
 */
export const ChatbotSettings = model
  .define("chatbot_settings", {
    id: model.text().primaryKey(),
    enabled: model.boolean().default(false),
    provider: model
      .enum(["openrouter", "gemini", "openai_compatible"])
      .default("openrouter"),
    base_url: model.text().nullable(),
    api_key_encrypted: model.text().nullable(),
    model: model.text().nullable(),
    task_models: model.json().nullable(),
    stt_provider: model.enum(["openai", "gemini", "none"]).default("none"),
    stt_api_key_encrypted: model.text().nullable(),
    stt_model: model.text().nullable(),
    system_prompt: model.text().nullable(),
    temperature: model.number().default(0.4),
    max_tokens: model.number().default(1024),
  })
