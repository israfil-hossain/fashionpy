import { useState } from "react"
import { Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import {
  StatCard,
  ChartCard,
  PeriodSelector,
  RevenueChart,
  StatusDonut,
} from "@mercurjs/dashboard-shared"
import { SingleColumnPage } from "../../components/layout/pages"
import { WidgetZone } from "@mercurjs/dashboard-shared"
import { useAnalytics } from "../../hooks/api/analytics"

const formatMoney = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0)

export const AnalyticsPage = () => {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "12m">("30d")
  const { data, isLoading } = useAnalytics(period)
  const d = data ?? {}
  const kpis = d.kpis ?? {}

  return (
    <SingleColumnPage>
      <WidgetZone id="analytics.list">
        <div className="flex flex-col gap-y-4 p-6">
          <div className="flex items-center justify-between">
            <Heading level="h1">{t("analytics.title", "Analytics")}</Heading>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label={t("analytics.revenue", "Revenue")}
              value={formatMoney(kpis.revenue ?? 0)}
              loading={isLoading}
            />
            <StatCard
              label={t("analytics.orders", "Orders")}
              value={kpis.orders ?? 0}
              loading={isLoading}
            />
            <StatCard
              label={t("analytics.aov", "Avg Order Value")}
              value={formatMoney(kpis.aov ?? 0)}
              loading={isLoading}
            />
            <StatCard
              label={t("analytics.activeOffers", "Active Offers")}
              value={kpis.active_offers ?? 0}
              loading={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label={t("analytics.activeBundles", "Active Bundles")}
              value={kpis.active_bundles ?? 0}
              loading={isLoading}
            />
            <StatCard
              label={t("analytics.activePromotions", "Active Promotions")}
              value={kpis.active_promotions ?? 0}
              loading={isLoading}
            />
            <StatCard
              label={t("analytics.payoutsPaid", "Payouts Paid")}
              value={formatMoney(d.payouts?.paid ?? 0)}
              loading={isLoading}
            />
            <StatCard
              label={t("analytics.payoutsPending", "Payouts Pending")}
              value={formatMoney(d.payouts?.pending ?? 0)}
              hint={`${d.payouts?.pending_count ?? 0} payouts`}
              loading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <ChartCard
              title={t("analytics.revenue", "Revenue")}
              subtitle={period}
              className="lg:col-span-2"
            >
              <RevenueChart data={d.revenue_series ?? []} valueKey="revenue" />
            </ChartCard>
            <ChartCard title={t("analytics.ordersByStatus", "Orders by Status")}>
              <StatusDonut data={d.orders_by_status ?? []} />
            </ChartCard>
          </div>

          <ChartCard title={t("analytics.topProducts", "Top Products")}>
            <div className="flex flex-col gap-y-2">
              {(d.top_products ?? []).map((p: any) => (
                <div
                  key={p.product_id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ui-fg-base truncate">{p.title}</span>
                  <span className="text-ui-fg-subtle">
                    {formatMoney(p.revenue)} · {p.units}u
                  </span>
                </div>
              ))}
              {(d.top_products ?? []).length === 0 && (
                <Text size="small" className="text-ui-fg-muted">
                  No data
                </Text>
              )}
            </div>
          </ChartCard>
        </div>
      </WidgetZone>
    </SingleColumnPage>
  )
}
