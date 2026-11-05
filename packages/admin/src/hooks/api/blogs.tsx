import { useMutation, useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const BLOG_POSTS_QUERY_KEY = "blog-posts" as const
export const blogPostsQueryKeys = queryKeysFactory(BLOG_POSTS_QUERY_KEY)

const BLOG_CATEGORIES_QUERY_KEY = "blog-categories" as const
export const blogCategoriesQueryKeys = queryKeysFactory(BLOG_CATEGORIES_QUERY_KEY)

export const useBlogPosts = (query?: any, options?: any) => {
  const { data, ...rest } = useQuery({
    queryKey: blogPostsQueryKeys.list(query),
    queryFn: () => sdk.admin.blog_posts.query({ ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useBlogPost = (id: string, query?: any, options?: any) => {
  const { data, ...rest } = useQuery({
    queryKey: blogPostsQueryKeys.detail(id),
    queryFn: () => sdk.admin.blog_posts.$id.query({ $id: id, ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useCreateBlogPost = (options?: any) =>
  useMutation({
    mutationFn: (payload: any) => sdk.admin.blog_posts.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogPostsQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useUpdateBlogPost = (id: string, options?: any) =>
  useMutation({
    mutationFn: (payload: any) =>
      sdk.admin.blog_posts.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogPostsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: blogPostsQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useDeleteBlogPost = (options?: any) =>
  useMutation({
    mutationFn: (id: string) => sdk.admin.blog_posts.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogPostsQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useBlogCategories = (query?: any, options?: any) => {
  const { data, ...rest } = useQuery({
    queryKey: blogCategoriesQueryKeys.list(query),
    queryFn: () => sdk.admin.blog_categories.query({ ...query }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useCreateBlogCategory = (options?: any) =>
  useMutation({
    mutationFn: (payload: any) => sdk.admin.blog_categories.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: blogCategoriesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useUpdateBlogCategory = (id: string, options?: any) =>
  useMutation({
    mutationFn: (payload: any) =>
      sdk.admin.blog_categories.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: blogCategoriesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: blogCategoriesQueryKeys.detail(id),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useDeleteBlogCategory = (options?: any) =>
  useMutation({
    mutationFn: (id: string) =>
      sdk.admin.blog_categories.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: blogCategoriesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
