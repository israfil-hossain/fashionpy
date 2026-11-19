import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261119000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "policy_page" ("id" text not null, "title" text not null, "slug" text not null, "excerpt" text null, "content" text null, "status" text not null default 'draft' check ("status" in ('draft', 'published')), "published_at" timestamptz null, "unpublished_at" timestamptz null, "country_codes" text[] null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "policy_page_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_policy_page_slug_unique" ON "policy_page" ("slug") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_policy_page_status_published_at" ON "policy_page" ("status", "published_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_policy_page_deleted_at" ON "policy_page" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "policy_page" cascade;`)
  }
}
