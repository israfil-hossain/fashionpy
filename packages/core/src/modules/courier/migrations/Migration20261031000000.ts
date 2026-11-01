import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261031000000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "courier_account" ("id" text not null, "provider" text not null, "seller_id" text null, "status" text check ("status" in ('pending', 'active', 'failed')) not null default 'pending', "cod_enabled" boolean not null default true, "data" jsonb not null default '{}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "courier_account_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_account_deleted_at" ON "courier_account" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_account_provider" ON "courier_account" ("provider") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_account_seller_id" ON "courier_account" ("seller_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "courier_shipment" ("id" text not null, "provider" text not null, "consignment_id" text not null, "tracking_code" text null, "tracking_url" text null, "status" text check ("status" in ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'canceled', 'failed')) not null default 'pending', "order_id" text not null, "fulfillment_id" text not null, "cod_amount" numeric null, "delivery_fee" numeric null, "currency_code" text null, "raw_cod_amount" jsonb null, "raw_delivery_fee" jsonb null, "data" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "courier_shipment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_shipment_deleted_at" ON "courier_shipment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_shipment_provider" ON "courier_shipment" ("provider") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_courier_shipment_provider_consignment" ON "courier_shipment" ("provider", "consignment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_shipment_order_id" ON "courier_shipment" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_shipment_fulfillment_id" ON "courier_shipment" ("fulfillment_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "courier_shipment" cascade;`);
    this.addSql(`drop table if exists "courier_account" cascade;`);
  }

}
