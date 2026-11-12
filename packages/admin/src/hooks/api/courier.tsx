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

const COURIER_SHIPMENTS_QUERY_KEY = "courier_shipments" as const
export const courierShipmentsQueryKeys = queryKeysFactory(
  COURIER_SHIPMENTS_QUERY_KEY
)

export type AdminCourierShipment = {
  id: string
  provider: string
  consignment_id: string
  tracking_code: string | null
  status: string
  order_id: string
  fulfillment_id: string
  cod_amount: number | null
  currency_code: string | null
  cod_remitted_at: string | null
  cod_remittance_reference: string | null
  created_at: string
  updated_at: string
}

export const useCourierShipments = (
  query: { order_id?: string; fulfillment_id?: string; status?: string },
  options?: UseQueryOptions<
    { courier_shipments: AdminCourierShipment[]; count: number },
    ClientError,
    { courier_shipments: AdminCourierShipment[]; count: number }
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: courierShipmentsQueryKeys.list(query),
    queryFn: () =>
      sdk.admin.courierShipments.query({ ...query }) as Promise<{
        courier_shipments: AdminCourierShipment[]
        count: number
      }>,
    ...options,
  })
  return { ...data, ...rest }
}

/**
 * Records that the courier remitted a COD shipment's cash — the fact the
 * payout gate waits on — and re-decides the order's payout server-side.
 */
export const useMarkCodRemitted = (
  id: string,
  options?: UseMutationOptions<
    { shipment: AdminCourierShipment },
    ClientError,
    { reference?: string }
  >
) => {
  return useMutation({
    mutationFn: (input) =>
      sdk.admin.courierShipments.$id.remittance.mutate({
        $id: id,
        ...(input?.reference ? { reference: input.reference } : {}),
      }) as Promise<{ shipment: AdminCourierShipment }>,
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: courierShipmentsQueryKeys.lists(),
        }),
        queryClient.invalidateQueries({ queryKey: ["payouts"] }),
      ])
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
