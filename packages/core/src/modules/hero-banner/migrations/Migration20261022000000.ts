import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261022000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "hero_banner" add column if not exists "slot" text not null default 'hero';`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_hero_banner_slot" ON "hero_banner" ("slot");`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_hero_banner_slot";`)
    this.addSql(`alter table "hero_banner" drop column if exists "slot";`)
  }
}
