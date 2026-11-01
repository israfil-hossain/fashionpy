import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client"
import { QueryKey, useMutation, UseMutationOptions, useQuery, UseQueryOptions } from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const NOTIFICATIONS_QUERY_KEY = "notifications" as const
export const notificationsQueryKeys = queryKeysFactory(NOTIFICATIONS_QUERY_KEY)

export type NotificationFeedQuery = InferClientInput<
  typeof sdk.admin.notifications.query
>

export const useNotificationFeedList = (
  query?: NotificationFeedQuery,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.notifications.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.notifications.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: notificationsQueryKeys.list(query),
    queryFn: () =>
      sdk.admin.notifications.query({
        ...query,
        offset: query?.offset ?? 0,
        limit: query?.limit ?? 50,
      }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useMarkNotificationRead = (
  options?: UseMutationOptions<unknown, ClientError, string>
) =>
  useMutation({
    mutationFn: (id: string) =>
      sdk.admin.notifications.$id.read.mutate({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useMarkAllNotificationsRead = (
  options?: UseMutationOptions<{ count: number }, ClientError, void>
) =>
  useMutation({
    mutationFn: () => sdk.admin.notifications.readAll.mutate(),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
