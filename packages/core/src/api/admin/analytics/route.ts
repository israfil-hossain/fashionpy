import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
}

function periodStart(period: string): Date {
  const days = PERIOD_DAYS[period] ?? 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function bucketExpr(period: string): string {
  if (period === "12m") return "to_char(o.created_at, 'YYYY-MM')"
  if (period === "90d") return "to_char(o.created_at, 'IYYY-IW')"
  return "to_char(o.created_at, 'YYYY-MM-DD')"
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const knex = req.scope.resolve<any>(ContainerRegistrationKeys.PG_CONNECTION)
  const period = (req.query?.period as string) || "30d"
  const start = periodStart(period)
  const bucket = bucketExpr(period)

  // KPIs
  const [gmvRow] = await knex("order as o")
    .leftJoin("order_summary as os", "os.order_id", "o.id")
    .where("o.deleted_at", null)
    .where("o.is_draft_order", false)
    .where("o.created_at", ">=", start)
    .whereNotIn("o.status", ["canceled"])
    .select(knex.raw("COALESCE(SUM((os.totals->>'current_order_total')::numeric), 0) as gmv"))
    .select(knex.raw("COUNT(DISTINCT o.id) as orders"))

  const [sellersRow] = await knex("seller")
    .whereNull("deleted_at")
    .select(knex.raw("COUNT(*) as total"))
    .select(knex.raw("COUNT(*) FILTER (WHERE status = 'active') as active"))

  const [offersRow] = await knex("offer")
    .whereNull("deleted_at")
    .select(knex.raw("COUNT(*) as total"))

  const [pointsRow] = await knex("fp_loyalty_transaction")
    .where("type", "earn")
    .where("created_at", ">=", start)
    .select(knex.raw("COALESCE(SUM(points_delta), 0) as points_issued"))

  const [redemptionsRow] = await knex("fp_reward_redemption")
    .where("created_at", ">=", start)
    .select(knex.raw("COALESCE(SUM(discount_amount), 0) as discount_total"))
    .select(knex.raw("COUNT(*) as count"))

  const [bundlesRow] = await knex("fp_bundle")
    .whereNull("deleted_at")
    .where("status", "active")
    .select(knex.raw("COUNT(*) as active_bundles"))

  const [promosRow] = await knex("fp_promotion")
    .whereNull("deleted_at")
    .where("status", "active")
    .select(knex.raw("COUNT(*) as active_promotions"))

  const orders = Number(gmvRow?.orders ?? 0)
  const gmv = Number(gmvRow?.gmv ?? 0)

  // Revenue series
  const seriesRows = await knex("order as o")
    .leftJoin("order_summary as os", "os.order_id", "o.id")
    .where("o.deleted_at", null)
    .where("o.is_draft_order", false)
    .where("o.created_at", ">=", start)
    .whereNotIn("o.status", ["canceled"])
    .select(knex.raw(`${bucket} as bucket`))
    .select(knex.raw("COALESCE(SUM((os.totals->>'current_order_total')::numeric), 0) as gmv"))
    .select(knex.raw("COUNT(DISTINCT o.id) as orders"))
    .groupByRaw(bucket)
    .orderByRaw(`${bucket} asc`)

  // Orders by status
  const statusRows = await knex("order")
    .whereNull("deleted_at")
    .where("is_draft_order", false)
    .where("created_at", ">=", start)
    .select("status")
    .count({ count: "*" })
    .groupBy("status")

  // Top sellers
  const topSellerRows = await knex("order as o")
    .leftJoin("order_summary as os", "os.order_id", "o.id")
    .join("order_order_seller_seller as oss", "oss.order_id", "o.id")
    .join("seller as s", "s.id", "oss.seller_id")
    .where("o.deleted_at", null)
    .where("o.is_draft_order", false)
    .where("o.created_at", ">=", start)
    .whereNotIn("o.status", ["canceled"])
    .whereNull("oss.deleted_at")
    .select("s.id", "s.name", "s.handle")
    .select(knex.raw("COALESCE(SUM((os.totals->>'current_order_total')::numeric), 0) as revenue"))
    .select(knex.raw("COUNT(DISTINCT o.id) as orders"))
    .groupBy("s.id", "s.name", "s.handle")
    .orderByRaw("revenue desc")
    .limit(10)

  // Top products
  const topProductRows = await knex("order as o")
    .join("order_item as oi", "oi.order_id", "o.id")
    .join("order_line_item as oli", "oli.id", "oi.item_id")
    .where("o.deleted_at", null)
    .where("o.is_draft_order", false)
    .where("o.created_at", ">=", start)
    .whereNotIn("o.status", ["canceled"])
    .whereNull("oi.deleted_at")
    .whereNull("oli.deleted_at")
    .select("oli.product_id", "oli.product_title")
    .select(knex.raw("COALESCE(SUM(oli.quantity), 0) as units"))
    .select(knex.raw("COALESCE(SUM(oi.unit_price * oi.quantity), 0) as revenue"))
    .groupBy("oli.product_id", "oli.product_title")
    .orderByRaw("revenue desc")
    .limit(10)

  // Recent orders
  const recentOrders = await knex("order as o")
    .leftJoin("order_summary as os", "os.order_id", "o.id")
    .where("o.deleted_at", null)
    .where("o.is_draft_order", false)
    .whereNotIn("o.status", ["canceled"])
    .select("o.id", "o.display_id", "o.status", "o.currency_code", "o.created_at", "o.email")
    .select(knex.raw("COALESCE((os.totals->>'current_order_total')::numeric, 0) as total"))
    .orderBy("o.created_at", "desc")
    .limit(8)

  // Payouts summary
  const [payoutsRow] = await knex("payout")
    .whereNull("deleted_at")
    .select(knex.raw("COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid"))
    .select(knex.raw("COALESCE(SUM(amount) FILTER (WHERE status IN ('pending','processing')), 0) as pending"))
    .select(knex.raw("COUNT(*) FILTER (WHERE status IN ('pending','processing')) as pending_count"))

  res.json({
    period,
    kpis: {
      gmv,
      orders,
      aov: orders ? gmv / orders : 0,
      active_sellers: Number(sellersRow?.active ?? 0),
      total_sellers: Number(sellersRow?.total ?? 0),
      active_offers: Number(offersRow?.total ?? 0),
      points_issued: Number(pointsRow?.points_issued ?? 0),
      redemptions_count: Number(redemptionsRow?.count ?? 0),
      redemptions_discount: Number(redemptionsRow?.discount_total ?? 0),
      active_bundles: Number(bundlesRow?.active_bundles ?? 0),
      active_promotions: Number(promosRow?.active_promotions ?? 0),
    },
    revenue_series: seriesRows.map((r: any) => ({
      bucket: r.bucket,
      gmv: Number(r.gmv ?? 0),
      orders: Number(r.orders ?? 0),
    })),
    orders_by_status: statusRows.map((r: any) => ({
      status: r.status,
      count: Number(r.count ?? 0),
    })),
    top_sellers: topSellerRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      handle: r.handle,
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders ?? 0),
    })),
    top_products: topProductRows.map((r: any) => ({
      product_id: r.product_id,
      title: r.product_title,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
    })),
    recent_orders: recentOrders.map((r: any) => ({
      id: r.id,
      display_id: r.display_id,
      status: r.status,
      currency_code: r.currency_code,
      total: Number(r.total ?? 0),
      email: r.email,
      created_at: r.created_at,
    })),
    payouts: {
      paid: Number(payoutsRow?.paid ?? 0),
      pending: Number(payoutsRow?.pending ?? 0),
      pending_count: Number(payoutsRow?.pending_count ?? 0),
    },
  })
}
