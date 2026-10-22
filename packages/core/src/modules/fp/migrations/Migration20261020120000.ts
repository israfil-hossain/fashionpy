import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261020120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "fp_bundle" ("id" text not null, "seller_id" text not null, "title" text not null, "slug" text null, "status" text check ("status" in ('draft','pending_approval','active','paused','expired')) not null default 'draft', "discount_type" text check ("discount_type" in ('fixed_price','percentage','fixed_amount')) not null default 'fixed_price', "discount_value" integer null, "starts_at" timestamptz null, "ends_at" timestamptz null, "max_uses" integer null, "uses_count" integer not null default 0, "funding_mode" text check ("funding_mode" in ('seller','marketplace','shared')) not null default 'seller', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_bundle_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_bundle_seller_id" ON "fp_bundle" ("seller_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_bundle_status" ON "fp_bundle" ("status");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_bundle_deleted_at" ON "fp_bundle" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_bundle_item" ("id" text not null, "bundle_id" text not null, "offer_id" text null, "variant_id" text null, "quantity" integer not null default 1, "is_required" boolean not null default true, "sort_order" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_bundle_item_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_bundle_item_bundle_id" ON "fp_bundle_item" ("bundle_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_bundle_item_deleted_at" ON "fp_bundle_item" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_promotion" ("id" text not null, "code" text null, "name" text null, "status" text check ("status" in ('draft','active','paused','expired')) not null default 'draft', "minimum_spend" integer null, "discount_cap" integer null, "max_uses" integer null, "uses_count" integer not null default 0, "combinable" boolean not null default false, "funding_mode" text check ("funding_mode" in ('seller','marketplace','shared')) not null default 'marketplace', "starts_at" timestamptz null, "ends_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_promotion_pkey" primary key ("id"));`)

    this.addSql(`create table if not exists "fp_promotion_application" ("id" text not null, "promotion_id" text null, "cart_id" text null, "order_id" text null, "order_group_id" text null, "discount_amount" integer not null default 0, "snapshot" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_promotion_application_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_promo_app_order_id" ON "fp_promotion_application" ("order_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_promo_app_cart_id" ON "fp_promotion_application" ("cart_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_promo_app_deleted_at" ON "fp_promotion_application" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_loyalty_account" ("id" text not null, "customer_id" text not null, "available_points" integer not null default 0, "pending_points" integer not null default 0, "lifetime_earned" integer not null default 0, "lifetime_redeemed" integer not null default 0, "status" text check ("status" in ('active','suspended','closed')) not null default 'active', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_loyalty_account_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fp_loyalty_account_customer_id" ON "fp_loyalty_account" ("customer_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_loyalty_account_deleted_at" ON "fp_loyalty_account" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_loyalty_transaction" ("id" text not null, "account_id" text not null, "order_id" text null, "type" text check ("type" in ('earn','redeem','reserve','release','reverse','adjust','expire')) not null default 'earn', "points_delta" integer not null default 0, "status" text check ("status" in ('pending','committed','reversed')) not null default 'committed', "expires_at" timestamptz null, "idempotency_key" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_loyalty_transaction_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_loyalty_txn_account_id" ON "fp_loyalty_transaction" ("account_id");`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fp_loyalty_txn_idempotency" ON "fp_loyalty_transaction" ("idempotency_key") WHERE deleted_at IS NULL AND idempotency_key IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_loyalty_txn_deleted_at" ON "fp_loyalty_transaction" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_reward_rule" ("id" text not null, "name" text null, "points_per_unit" integer not null default 5, "spend_unit" integer not null default 100, "points_per_currency_unit" integer null, "minimum_redemption" integer not null default 500, "maximum_discount_percent" integer not null default 10, "expiry_days" integer not null default 365, "active_from" timestamptz null, "active_until" timestamptz null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_reward_rule_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_reward_rule_deleted_at" ON "fp_reward_rule" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_reward_redemption" ("id" text not null, "customer_id" text not null, "order_id" text null, "order_group_id" text null, "points_reserved" integer not null default 0, "points_redeemed" integer not null default 0, "discount_amount" integer not null default 0, "conversion_rate" integer null, "status" text check ("status" in ('reserved','redeemed','released','reversed')) not null default 'reserved', "expires_at" timestamptz null, "idempotency_key" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_reward_redemption_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_reward_redemption_customer" ON "fp_reward_redemption" ("customer_id");`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fp_reward_redemption_idempotency" ON "fp_reward_redemption" ("idempotency_key") WHERE deleted_at IS NULL AND idempotency_key IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_reward_redemption_deleted_at" ON "fp_reward_redemption" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_discount_allocation" ("id" text not null, "order_id" text null, "order_line_id" text null, "promotion_application_id" text null, "funding_party" text check ("funding_party" in ('marketplace','seller')) not null default 'marketplace', "seller_id" text null, "amount" integer not null default 0, "status" text check ("status" in ('estimated','committed','reversed','settled')) not null default 'estimated', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_discount_allocation_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_discount_alloc_order_id" ON "fp_discount_allocation" ("order_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_discount_alloc_seller_id" ON "fp_discount_allocation" ("seller_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_discount_alloc_deleted_at" ON "fp_discount_allocation" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_funding_policy" ("id" text not null, "name" text null, "default_split_marketplace_percent" integer not null default 40, "seller_cap" integer null, "marketplace_budget_cap" integer null, "eligible_promotion_types" jsonb null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_funding_policy_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_funding_policy_deleted_at" ON "fp_funding_policy" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "fp_product_relation" ("id" text not null, "source_product_id" text not null, "target_product_id" text not null, "relation_type" text check ("relation_type" in ('upsell','cross_sell','frequently_bought_together')) not null default 'upsell', "priority" integer not null default 0, "status" text check ("status" in ('active','inactive')) not null default 'active', "seller_id" text null, "starts_at" timestamptz null, "ends_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fp_product_relation_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_product_relation_source" ON "fp_product_relation" ("source_product_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fp_product_relation_deleted_at" ON "fp_product_relation" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fp_product_relation" cascade;`)
    this.addSql(`drop table if exists "fp_funding_policy" cascade;`)
    this.addSql(`drop table if exists "fp_discount_allocation" cascade;`)
    this.addSql(`drop table if exists "fp_reward_redemption" cascade;`)
    this.addSql(`drop table if exists "fp_reward_rule" cascade;`)
    this.addSql(`drop table if exists "fp_loyalty_transaction" cascade;`)
    this.addSql(`drop table if exists "fp_loyalty_account" cascade;`)
    this.addSql(`drop table if exists "fp_promotion_application" cascade;`)
    this.addSql(`drop table if exists "fp_promotion" cascade;`)
    this.addSql(`drop table if exists "fp_bundle_item" cascade;`)
    this.addSql(`drop table if exists "fp_bundle" cascade;`)
  }
}
