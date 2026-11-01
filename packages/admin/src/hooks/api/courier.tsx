import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const COURIER_QUERY_KEY = "courier_accounts" as const
export const courierAccountsQueryKeys = queryKeysFactory(COURIER_QUERY_KEY)

export const useCourierAccounts = (
  query?: Record<string, any>,
  options?: UseQueryOptions<any, ClientError, any>
) => {
  const { data, ...rest } = useQuery({
    queryKey: courierAccountsQueryKeys.list(query),
    queryFn: () => sdk.admin.courierAccounts.query({ ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

/**
 * Creates or updates the platform courier account (seller_id = null).
 */
export const useUpsertPlatformCourierAccount = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.courierAccounts.mutate>,
    ClientError,
    InferClientInput<typeof sdk.admin.courierAccounts.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.courierAccounts.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: courierAccountsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
