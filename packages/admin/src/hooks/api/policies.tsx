import { useMutation, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const POLICY_PAGES_QUERY_KEY = "policy-pages" as const
export const policyPagesQueryKeys = queryKeysFactory(POLICY_PAGES_QUERY_KEY)

export const usePolicies = (query?: any, options?: any) => {
  const { data, ...rest } = useQuery({
    queryKey: policyPagesQueryKeys.list(query),
    queryFn: () => sdk.admin.policies.query({ ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

export const usePolicy = (id: string, query?: any, options?: any) => {
  const { data, ...rest } = useQuery({
    queryKey: policyPagesQueryKeys.detail(id),
    queryFn: () => sdk.admin.policies.$id.query({ $id: id, ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useCreatePolicy = (options?: any) =>
  useMutation({
    mutationFn: (payload: any) => sdk.admin.policies.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: policyPagesQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useUpdatePolicy = (id: string, options?: any) =>
  useMutation({
    mutationFn: (payload: any) =>
      sdk.admin.policies.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: policyPagesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: policyPagesQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useDeletePolicy = (options?: any) =>
  useMutation({
    mutationFn: (id: string) => sdk.admin.policies.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: policyPagesQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
