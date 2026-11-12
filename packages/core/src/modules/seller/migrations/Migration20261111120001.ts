import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261111120001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payment_details" add column if not exists "payout_method" text null;`);
    this.addSql(`alter table if exists "payment_details" add column if not exists "wallet_number" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payment_details" drop column if exists "payout_method";`);
    this.addSql(`alter table if exists "payment_details" drop column if exists "wallet_number";`);
  }

}
