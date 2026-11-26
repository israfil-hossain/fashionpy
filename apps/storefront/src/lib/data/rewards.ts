'use server'

import { sdk } from '../client'
import { getAuthHeaders } from './cookies'

export type LoyaltyAccount = {
  id: string
  customer_id: string
  available_points: number
  pending_points: number
  lifetime_earned: number
  lifetime_redeemed: number
  status: string
}

export type LoyaltyTransaction = {
  id: string
  type: string
  points_delta: number
  status: string
  created_at: string
}

export type RewardEstimate = {
  points_requested: number
  points_value_bdt: number
  discount_bdt: number
  maximum_discount_bdt: number
  status: 'eligible' | 'insufficient_points'
}

const headers = async () => ({
  ...(await getAuthHeaders()),
  'Content-Type': 'application/json',
})

export const getLoyaltySummary = async (): Promise<{
  account: LoyaltyAccount | null
  available_points: number
}> => {
  try {
    const res = (await (sdk.store.fp.rewards.query({
      fetchOptions: { headers: await headers(), cache: 'no-cache' },
    } as never)) as unknown as Promise<{
      account: LoyaltyAccount
      available_points: number
    }>)
    return await res
  } catch {
    return { account: null, available_points: 0 }
  }
}

export const getLoyaltyTransactions = async (): Promise<
  LoyaltyTransaction[]
> => {
  try {
    const res = (await (sdk.store.fp.rewards.transactions.query({
      limit: 50,
      fetchOptions: { headers: await headers(), cache: 'no-cache' },
    } as never)) as unknown as Promise<{ transactions: LoyaltyTransaction[] }>)
    return (await res).transactions ?? []
  } catch {
    return []
  }
}

export const applyPointsToCart = async (
  cartId: string,
  points: number
): Promise<{ success: boolean; discount_bdt?: number; message?: string }> => {
  try {
    const result = await (sdk.store.fp.rewards.applyToCart.mutate({
      cart_id: cartId,
      points_to_redeem: points,
      fetchOptions: { headers: await headers() },
    } as never) as unknown as Promise<{ discount_bdt: number }>)
    return { success: true, discount_bdt: result.discount_bdt }
  } catch (error) {
    return {
      success: false,
      message: (error as Error)?.message || "Could not apply points",
    }
  }
}

export const estimatePointsRedemption = async (
  points: number,
  eligibleSubtotalBdt = 0
): Promise<RewardEstimate | null> => {
  try {
    return await (sdk.store.fp.rewards.estimate.mutate({
      points_to_redeem: points,
      eligible_subtotal_bdt: eligibleSubtotalBdt,
      fetchOptions: { headers: await headers() },
    } as never) as unknown as Promise<RewardEstimate>)
  } catch {
    return null
  }
}
