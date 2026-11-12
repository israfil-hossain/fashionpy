import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261111120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "courier_shipment" add column if not exists "cod_remitted_at" timestamptz null;`);
    this.addSql(`alter table if exists "courier_shipment" add column if not exists "cod_remittance_reference" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "courier_shipment" drop column if exists "cod_remitted_at";`);
    this.addSql(`alter table if exists "courier_shipment" drop column if exists "cod_remittance_reference";`);
  }

}
