import { ClientError, InferClientOutput, InferClientInput } from "@mercurjs/client"
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const COURIER_QUERY_KEY = "courier" as const
export const courierQueryKeys = queryKeysFactory(COURIER_QUERY_KEY)

export const useCourierAccounts = (
  query?: Record<string, any>,
  options?: UseQueryOptions<any, ClientError, any>
) => {
  const { data, ...rest } = useQuery({
    queryKey: courierQueryKeys.list(query),
    queryFn: () => sdk.vendor.courierAccounts.query({ ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useCreateCourierAccount = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.courierAccounts.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.courierAccounts.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.courierAccounts.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: courierQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * Payload carries `$id` so one hook instance can serve any row — account ids
 * are dynamic (list rows) and hooks must not be created inside callbacks.
 */
export const useUpdateCourierAccount = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.courierAccounts.$id.mutate>,
    ClientError,
    { $id: string } & Record<string, unknown>
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.courierAccounts.$id.mutate(payload as any),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: courierQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteCourierAccount = (
  options?: UseMutationOptions<any, ClientError, { id: string }>
) => {
  return useMutation({
    mutationFn: ({ id }) => sdk.vendor.courierAccounts.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: courierQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * Current courier shipment for one fulfillment (null when not booked yet).
 */
export const useCourierShipment = (
  orderId: string,
  fulfillmentId: string,
  options?: UseQueryOptions<any, ClientError, any>
) => {
  const { data, ...rest } = useQuery({
    queryKey: courierQueryKeys.detail(`${orderId}:${fulfillmentId}`),
    queryFn: () =>
      sdk.vendor.orders.$id.fulfillments.$fulfillment_id.courier.query({
        $id: orderId,
        $fulfillment_id: fulfillmentId,
      }),
    ...options,
  })
  return { ...data, ...rest }
}

export type BookCourierShipmentPayload = {
  provider: "pathao" | "steadfast" | "system"
  use_cod?: boolean
  cod_amount?: number
  delivery_type?: "normal" | "on_demand" | "point"
  special_instruction?: string
  item_description?: string
  weight?: number
}

/**
 * Book a consignment at the courier for an existing fulfillment — also
 * creates the fulfillment shipment (tracking labels) on success.
 */
export const useBookCourierShipment = (
  orderId: string,
  fulfillmentId: string,
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.vendor.orders.$id.fulfillments.$fulfillment_id.courier.mutate
    >,
    ClientError,
    BookCourierShipmentPayload
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.orders.$id.fulfillments.$fulfillment_id.courier.mutate({
        $id: orderId,
        $fulfillment_id: fulfillmentId,
        ...payload,
      } as any),
    onSuccess: (data, variables, context) => {
      // Booking creates the shipment → order fulfillment/labels change
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({
        queryKey: courierQueryKeys.detail(`${orderId}:${fulfillmentId}`),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
