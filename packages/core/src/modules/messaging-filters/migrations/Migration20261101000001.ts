import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261101000001 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "filter_rule" (
        "id" text not null,
        "match_type" text check ("match_type" in ('exact', 'contains', 'regex')) not null,
        "pattern" text not null,
        "is_builtin" boolean not null default false,
        "is_enabled" boolean not null default true,
        "description" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "filter_rule_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_filter_rule_deleted_at" ON "filter_rule" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "blocked_message_log" (
        "id" text not null,
        "sender_id" text not null,
        "sender_type" text check ("sender_type" in ('customer', 'seller')) not null,
        "conversation_id" text not null,
        "matched_rule_id" text not null,
        "message_body" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "blocked_message_log_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_blocked_message_log_created_at" ON "blocked_message_log" ("created_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_blocked_message_log_deleted_at" ON "blocked_message_log" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "blocked_message_log" cascade;`)
    this.addSql(`drop table if exists "filter_rule" cascade;`)
  }
}
