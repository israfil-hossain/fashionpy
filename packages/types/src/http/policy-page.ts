import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { PolicyPageDTO } from "../policy-page"

export interface AdminPolicyPageResponse {
  policy_page: PolicyPageDTO
}

export type AdminPolicyPageListResponse = PaginatedResponse<{
  policy_pages: PolicyPageDTO[]
}>

export type AdminPolicyPageDeleteResponse = DeleteResponse<"policy_page">

export interface StorePolicyPageResponse {
  policy_page: PolicyPageDTO
}

export type StorePolicyPageListResponse = PaginatedResponse<{
  policy_pages: PolicyPageDTO[]
}>
