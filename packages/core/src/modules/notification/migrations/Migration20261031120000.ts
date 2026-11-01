import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261031120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "notification_feed" (
        "id" text NOT NULL PRIMARY KEY,
        "recipient_type" text NOT NULL CHECK ("recipient_type" IN ('admin', 'vendor', 'customer')),
        "recipient_id" text NOT NULL,
        "seller_id" text NULL,
        "event" text NOT NULL,
        "title" text NOT NULL,
        "body" text NULL,
        "link" text NULL,
        "resource_type" text NULL,
        "resource_id" text NULL,
        "data" jsonb NULL,
        "read_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_feed_recipient"
        ON "notification_feed" ("recipient_id", "created_at")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_feed_seller"
        ON "notification_feed" ("seller_id", "recipient_id", "created_at")
        WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_feed_unread"
        ON "notification_feed" ("recipient_id")
        WHERE "read_at" IS NULL AND "deleted_at" IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "notification_feed";`)
  }
}
