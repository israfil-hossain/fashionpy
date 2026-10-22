import { useMutation, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const HERO_BANNER_QUERY_KEY = "hero-banners" as const
export const heroBannersQueryKeys = queryKeysFactory(HERO_BANNER_QUERY_KEY)

export const useHeroBanners = (query?: any, options?: any) => {
  const { data, ...rest } = useQuery({
    queryKey: heroBannersQueryKeys.list(query),
    queryFn: () => sdk.admin.hero_banners.query({ ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useHeroBanner = (id: string, query?: any, options?: any) => {
  const { data, ...rest } = useQuery({
    queryKey: heroBannersQueryKeys.detail(id),
    queryFn: () => sdk.admin.hero_banners.$id.query({ $id: id, ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useCreateHeroBanner = (options?: any) => useMutation({
  mutationFn: (payload: any) => sdk.admin.hero_banners.mutate(payload),
  onSuccess: (data, variables, context) => {
    queryClient.invalidateQueries({ queryKey: heroBannersQueryKeys.lists() })
    options?.onSuccess?.(data, variables, context)
  },
  ...options,
})

export const useUpdateHeroBanner = (id: string, options?: any) => useMutation({
  mutationFn: (payload: any) => sdk.admin.hero_banners.$id.mutate({ $id: id, ...payload }),
  onSuccess: (data, variables, context) => {
    queryClient.invalidateQueries({ queryKey: heroBannersQueryKeys.lists() })
    queryClient.invalidateQueries({ queryKey: heroBannersQueryKeys.detail(id) })
    options?.onSuccess?.(data, variables, context)
  },
  ...options,
})

export const useDeleteHeroBanner = (id: string, options?: any) => useMutation({
  mutationFn: () => sdk.admin.hero_banners.$id.delete({ $id: id }),
  onSuccess: (data, variables, context) => {
    queryClient.invalidateQueries({ queryKey: heroBannersQueryKeys.lists() })
    queryClient.invalidateQueries({ queryKey: heroBannersQueryKeys.detail(id) })
    options?.onSuccess?.(data, variables, context)
  },
  ...options,
})
