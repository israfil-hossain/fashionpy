import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261125000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "hero_banner" add column if not exists "cta_active" boolean not null default true;`
    )
    this.addSql(`alter table "hero_banner" alter column "title" drop not null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "hero_banner" drop column if exists "cta_active";`)
    this.addSql(`update "hero_banner" set "title" = '' where "title" is null;`)
    this.addSql(`alter table "hero_banner" alter column "title" set not null;`)
  }
}
