import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261118000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "chatbot_conversation" (
        "id" text not null,
        "customer_id" text null,
        "guest_token" text null,
        "status" text check ("status" in ('open', 'closed')) not null default 'open',
        "locale" text check ("locale" in ('en', 'bn')) not null default 'en',
        "checkout_state" jsonb null,
        "last_message_preview" text null,
        "last_message_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "chatbot_conversation_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_chatbot_conversation_customer_id_status_last_message_at" ON "chatbot_conversation" ("customer_id", "status", "last_message_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_chatbot_conversation_guest_token" ON "chatbot_conversation" ("guest_token") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_chatbot_conversation_status_last_message_at" ON "chatbot_conversation" ("status", "last_message_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "chatbot_message" (
        "id" text not null,
        "conversation_id" text not null,
        "role" text check ("role" in ('user', 'assistant', 'tool')) not null,
        "content" text not null,
        "cards" jsonb null,
        "tool_name" text null,
        "locale" text check ("locale" in ('en', 'bn')) null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "chatbot_message_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_chatbot_message_conversation_id_created_at_id" ON "chatbot_message" ("conversation_id", "created_at", "id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_chatbot_message_created_at" ON "chatbot_message" ("created_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "chatbot_settings" (
        "id" text not null,
        "enabled" boolean not null default false,
        "provider" text check ("provider" in ('openrouter', 'gemini', 'openai_compatible')) not null default 'openrouter',
        "base_url" text null,
        "api_key_encrypted" text null,
        "model" text null,
        "stt_provider" text check ("stt_provider" in ('openai', 'gemini', 'none')) not null default 'none',
        "stt_api_key_encrypted" text null,
        "stt_model" text null,
        "system_prompt" text null,
        "temperature" double precision not null default 0.4,
        "max_tokens" integer not null default 1024,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "chatbot_settings_pkey" primary key ("id")
      );`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "chatbot_settings" cascade;`)
    this.addSql(`drop table if exists "chatbot_message" cascade;`)
    this.addSql(`drop table if exists "chatbot_conversation" cascade;`)
  }
}
