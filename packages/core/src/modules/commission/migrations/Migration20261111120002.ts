import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261111120002 extends Migration {

  override async up(): Promise<void> {
    // Bump the seeded Global Commission from 0% to 10% — only rows still at
    // the seeded value, so an operator's custom rate is never overwritten.
    this.addSql(
      `update "commission_rate" set "value" = 10, "raw_value" = '{"value":"10"}'::jsonb ` +
        `where "id" = 'comrate_default' and "value" = 0 and "deleted_at" is null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `update "commission_rate" set "value" = 0, "raw_value" = '{"value":"0"}'::jsonb ` +
        `where "id" = 'comrate_default' and "value" = 10 and "deleted_at" is null;`
    );
  }

}
