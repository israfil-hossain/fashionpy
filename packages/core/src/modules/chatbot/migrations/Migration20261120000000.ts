import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261120000000 extends Migration {
  override async up(): Promise<void> {
    // SPEC-011: who authored an assistant message — 'ai' (default/legacy,
    // null reads as ai) or 'admin' (follow-up sent from the admin inbox).
    this.addSql(
      `alter table if exists "chatbot_message" add column if not exists "sender" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "chatbot_message" drop column if exists "sender";`
    )
  }
}
