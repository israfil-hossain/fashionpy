import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261124000000 extends Migration {
  override async up(): Promise<void> {
    // SPEC-017: per-task model slots. Keys inside the JSON remain encrypted,
    // exactly like the global `api_key_encrypted` column.
    this.addSql(
      `alter table if exists "chatbot_settings" add column if not exists "task_models" jsonb null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "chatbot_settings" drop column if exists "task_models";`
    )
  }
}
