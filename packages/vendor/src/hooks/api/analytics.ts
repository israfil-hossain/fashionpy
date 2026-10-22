import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const ANALYTICS_QUERY_KEY = "analytics" as const
export const analyticsQueryKeys = queryKeysFactory(ANALYTICS_QUERY_KEY)

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m"

export const useAnalytics = (
  period: AnalyticsPeriod = "30d",
  options?: Omit<UseQueryOptions<any, any, any, QueryKey>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.analytics.query({ period }),
    queryKey: analyticsQueryKeys.list({ period }),
    ...options,
  })

  return { data, ...rest }
}
