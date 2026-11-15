import { DeleteResponse, PaginatedResponse, PromotionDTO, PromotionRuleDTO } from "@medusajs/types"

/**
 * Public home-page projection of a promotion. Intentionally narrower than
 * `PromotionDTO` — no budget, rules, seller, or usage counters.
 * Named `StoreHomePromotion` to avoid colliding with Medusa's `StorePromotion`.
 */
export type StoreHomePromotion = {
  id: string
  code: string
  type: string
  is_automatic: boolean
  application_method?: {
    value?: number
    type?: string
    currency_code?: string | null
  } | null
  campaign?: {
    name?: string
    description?: string | null
    starts_at?: string | null
    ends_at?: string | null
  } | null
}

export type StoreHomePromotionListResponse = PaginatedResponse<{
  promotions: StoreHomePromotion[]
}>

export type VendorPromotion = PromotionDTO

export type VendorPromotionRule = PromotionRuleDTO

export type VendorPromotionResponse = {
  promotion: VendorPromotion
}

export type VendorPromotionListResponse = PaginatedResponse<{
  promotions: VendorPromotion[]
}>

export type VendorPromotionDeleteResponse = DeleteResponse<"promotion">

export type VendorPromotionRuleListResponse = {
  rules: VendorPromotionRule[]
}

export type VendorPromotionRuleBatchResponse = {
  created: VendorPromotionRule[]
  updated: VendorPromotionRule[]
  deleted: {
    ids: string[]
    object: string
    deleted: boolean
  }
}

export type VendorRuleAttributeOption = {
  id: string
  value: string
  label: string
  required: boolean
  field_type: string
  operators: {
    id: string
    value: string
    label: string
  }[]
}

export type VendorRuleAttributeOptionsListResponse = {
  attributes: VendorRuleAttributeOption[]
}

export type VendorRuleValueOption = {
  label: string
  value: string
}

export type VendorRuleValueOptionsListResponse = PaginatedResponse<{
  values: VendorRuleValueOption[]
}>
