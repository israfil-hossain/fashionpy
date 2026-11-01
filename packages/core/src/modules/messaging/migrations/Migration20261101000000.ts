import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261101000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "conversation" (
        "id" text not null,
        "type" text check ("type" in ('marketplace', 'support_customer', 'support_vendor')) not null default 'marketplace',
        "thread_key" text not null,
        "buyer_id" text null,
        "seller_id" text null,
        "last_message_preview" text null,
        "last_message_sender_type" text check ("last_message_sender_type" in ('customer', 'seller', 'admin')) null,
        "last_message_at" timestamptz null,
        "unread_count_customer" integer not null default 0,
        "unread_count_seller" integer not null default 0,
        "unread_count_admin" integer not null default 0,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "conversation_pkey" primary key ("id")
      );`
    )
    // Partial unique so a soft-deleted thread can be re-opened later.
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_conversation_thread_key_unique" ON "conversation" ("thread_key") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_conversation_type_last_message_at_id" ON "conversation" ("type", "last_message_at", "id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_conversation_seller_id_last_message_at_id" ON "conversation" ("seller_id", "last_message_at", "id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_conversation_buyer_id_last_message_at_id" ON "conversation" ("buyer_id", "last_message_at", "id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_conversation_deleted_at" ON "conversation" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "message" (
        "id" text not null,
        "conversation_id" text not null,
        "sender_id" text not null,
        "sender_type" text check ("sender_type" in ('customer', 'seller', 'admin')) not null,
        "body" text not null,
        "context_type" text check ("context_type" in ('product', 'order')) null,
        "context_id" text null,
        "context_label" text null,
        "read_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "message_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_message_conversation_id_created_at_id" ON "message" ("conversation_id", "created_at", "id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_message_context_type_context_id" ON "message" ("context_type", "context_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_message_created_at" ON "message" ("created_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_message_deleted_at" ON "message" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "chat_block" (
        "id" text not null,
        "customer_id" text not null,
        "blocked_by" text not null,
        "reason" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "chat_block_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_chat_block_customer_id_unique" ON "chat_block" ("customer_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_chat_block_deleted_at" ON "chat_block" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "message" cascade;`)
    this.addSql(`drop table if exists "chat_block" cascade;`)
    this.addSql(`drop table if exists "conversation" cascade;`)
  }
}
