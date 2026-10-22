import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { HeroBannerDTO } from "../hero-banner"

export interface AdminHeroBannerResponse {
  hero_banner: HeroBannerDTO
}

export type AdminHeroBannerListResponse = PaginatedResponse<{
  hero_banners: HeroBannerDTO[]
}>

export type AdminHeroBannerDeleteResponse = DeleteResponse<"hero_banner">

export interface StoreHeroBannerResponse {
  hero_banner: HeroBannerDTO
}

export type StoreHeroBannerListResponse = PaginatedResponse<{
  hero_banners: HeroBannerDTO[]
}>
