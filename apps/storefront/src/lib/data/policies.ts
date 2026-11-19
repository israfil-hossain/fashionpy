"use server"

import { sdk } from "../client"

export type StorePolicyPage = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content?: string | null
  status: string
  published_at: string | null
}

export const getPolicyBySlug = async ({
  slug,
  countryCode,
}: {
  slug: string
  countryCode?: string
}) => {
  try {
    const res = (await (sdk.store.policies.$slug.query({
      $slug: slug,
      ...(countryCode ? { country_code: countryCode } : {}),
      fetchOptions: { cache: "no-store" },
    } as never))) as { policy_page?: StorePolicyPage }

    return res?.policy_page ?? null
  } catch {
    return null
  }
}

export const listPolicies = async ({ countryCode }: { countryCode?: string } = {}) => {
  try {
    const res = (await (sdk.store.policies.query({
      limit: 50,
      ...(countryCode ? { country_code: countryCode } : {}),
      fetchOptions: { cache: "no-store" },
    } as never))) as { policy_pages?: StorePolicyPage[] }

    return res?.policy_pages ?? []
  } catch {
    return []
  }
}
