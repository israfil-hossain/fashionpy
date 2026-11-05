import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { BlogCategoryDTO, BlogPostDTO } from "../blog"

export interface AdminBlogPostResponse {
  blog_post: BlogPostDTO
}

export type AdminBlogPostListResponse = PaginatedResponse<{
  blog_posts: BlogPostDTO[]
}>

export type AdminBlogPostDeleteResponse = DeleteResponse<"blog_post">

export interface AdminBlogCategoryResponse {
  blog_category: BlogCategoryDTO
}

export type AdminBlogCategoryListResponse = PaginatedResponse<{
  blog_categories: BlogCategoryDTO[]
}>

export type AdminBlogCategoryDeleteResponse = DeleteResponse<"blog_category">

export interface StoreBlogPostResponse {
  blog_post: BlogPostDTO
}

export type StoreBlogPostListResponse = PaginatedResponse<{
  blog_posts: BlogPostDTO[]
}>

export interface StoreBlogCategoryResponse {
  blog_category: BlogCategoryDTO
}

export type StoreBlogCategoryListResponse = PaginatedResponse<{
  blog_categories: BlogCategoryDTO[]
}>
