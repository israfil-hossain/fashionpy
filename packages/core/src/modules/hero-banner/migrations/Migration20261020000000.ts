import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261020000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "hero_banner" ("id" text not null, "title" text not null, "subtitle" text null, "description" text null, "image_url" text not null, "cta_text" text null, "cta_link" text null, "text_position" text not null default 'left', "is_active" boolean not null default true, "rank" integer not null default 0, "starts_at" timestamptz null, "ends_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "hero_banner_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_hero_banner_rank" ON "hero_banner" ("rank");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_hero_banner_deleted_at" ON "hero_banner" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "hero_banner" cascade;`)
  }
}
