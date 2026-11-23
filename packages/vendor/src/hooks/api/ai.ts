import { ClientError, InferClientOutput } from "@mercurjs/client"
import { UseQueryOptions, useQuery } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const AI_QUOTA_QUERY_KEY = "ai_quota" as const
export const aiQuotaQueryKeys = queryKeysFactory(AI_QUOTA_QUERY_KEY)

export const useAiQuota = (
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.vendor.ai.quota.query>,
      ClientError
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: aiQuotaQueryKeys.detail("current"),
    queryFn: () => sdk.vendor.ai.quota.query({}),
    ...options,
  })

  return { ...data, ...rest }
}