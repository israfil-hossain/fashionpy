import { MedusaService } from "@medusajs/framework/utils"

import {
  FpBundle,
  FpBundleItem,
  FpPromotion,
  FpPromotionApplication,
  FpLoyaltyAccount,
  FpLoyaltyTransaction,
  FpRewardRule,
  FpRewardRedemption,
  FpDiscountAllocation,
  FpFundingPolicy,
  FpProductRelation,
} from "./models"

class FpModuleService extends MedusaService({
  FpBundle,
  FpBundleItem,
  FpPromotion,
  FpPromotionApplication,
  FpLoyaltyAccount,
  FpLoyaltyTransaction,
  FpRewardRule,
  FpRewardRedemption,
  FpDiscountAllocation,
  FpFundingPolicy,
  FpProductRelation,
}) {
  calculateEarnedPoints(eligibleSpend: number, pointsPerUnit = 5, spendUnit = 100): number {
    if (eligibleSpend <= 0 || spendUnit <= 0) {
      return 0
    }
    return Math.floor((eligibleSpend / spendUnit) * pointsPerUnit)
  }

  calculateDiscountBdt(points: number): number {
    return Math.floor(points / 100) * 10
  }

  async getOrCreateLoyaltyAccount(customerId: string) {
    const accounts = await this.listFpLoyaltyAccounts({ customer_id: customerId })
    const account = Array.isArray(accounts) ? accounts[0] : accounts
    if (account) {
      return account
    }
    const created = await this.createFpLoyaltyAccounts([{ customer_id: customerId }])
    return Array.isArray(created) ? created[0] : created
  }

  async reservePoints(input: {
    customerId: string
    points: number
    orderId?: string | null
    idempotencyKey?: string | null
  }) {
    const account = await this.getOrCreateLoyaltyAccount(input.customerId)
    if ((account.available_points || 0) < input.points) {
      throw new Error("Insufficient points")
    }
    await this.updateFpLoyaltyAccounts({
      id: account.id,
      available_points: (account.available_points || 0) - input.points,
    })
    const redemptionResult = await this.createFpRewardRedemptions([{
      customer_id: input.customerId,
      order_id: input.orderId || null,
      points_reserved: input.points,
      status: "reserved",
      idempotency_key: input.idempotencyKey || null,
    }])
    const redemption = Array.isArray(redemptionResult) ? redemptionResult[0] : redemptionResult
    await this.createFpLoyaltyTransactions([{
      account_id: account.id,
      order_id: input.orderId || null,
      type: "reserve",
      points_delta: -input.points,
      status: "pending",
      idempotency_key: input.idempotencyKey || null,
    }])
    return redemption
  }

  async releaseReservation(redemptionId: string) {
    const redemptions = await this.listFpRewardRedemptions({ id: redemptionId })
    const redemption = Array.isArray(redemptions) ? redemptions[0] : redemptions
    if (!redemption || redemption.status !== "reserved") {
      return redemption
    }
    const account = await this.getOrCreateLoyaltyAccount(redemption.customer_id)
    await this.updateFpLoyaltyAccounts({
      id: account.id,
      available_points: (account.available_points || 0) + (redemption.points_reserved || 0),
    })
    await this.updateFpRewardRedemptions({ id: redemptionId, status: "released" })
    await this.createFpLoyaltyTransactions([{
      account_id: account.id,
      order_id: redemption.order_id,
      type: "release",
      points_delta: redemption.points_reserved || 0,
      status: "committed",
    }])
    return redemption
  }

  async creditEarnedPoints(input: {
    customerId: string
    orderId: string
    eligibleSpend: number
    idempotencyKey?: string | null
  }) {
    const rules = await this.listFpRewardRules({ is_active: true })
    const rule = Array.isArray(rules) ? rules[0] : rules
    const pointsPerUnit = rule?.points_per_unit ?? 5
    const spendUnit = rule?.spend_unit ?? 100
    const earned = this.calculateEarnedPoints(input.eligibleSpend, pointsPerUnit, spendUnit)
    if (earned <= 0) {
      return null
    }
    if (input.idempotencyKey) {
      const existing = await this.listFpLoyaltyTransactions({ idempotency_key: input.idempotencyKey })
      const found = Array.isArray(existing) ? existing[0] : existing
      if (found) {
        return found
      }
    }
    const account = await this.getOrCreateLoyaltyAccount(input.customerId)
    const expiryDays = rule?.expiry_days ?? 365
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    const txnResult = await this.createFpLoyaltyTransactions([{
      account_id: account.id,
      order_id: input.orderId,
      type: "earn",
      points_delta: earned,
      status: "committed",
      expires_at: expiresAt,
      idempotency_key: input.idempotencyKey || null,
    }])
    const txn = Array.isArray(txnResult) ? txnResult[0] : txnResult
    await this.updateFpLoyaltyAccounts({
      id: account.id,
      available_points: (account.available_points || 0) + earned,
      pending_points: Math.max(0, (account.pending_points || 0) - earned),
      lifetime_earned: (account.lifetime_earned || 0) + earned,
    })
    return txn
  }

  async reversePoints(input: {
    customerId: string
    orderId: string
    points: number
    idempotencyKey?: string | null
  }) {
    if (input.idempotencyKey) {
      const existing = await this.listFpLoyaltyTransactions({ idempotency_key: input.idempotencyKey })
      const found = Array.isArray(existing) ? existing[0] : existing
      if (found) {
        return found
      }
    }
    const account = await this.getOrCreateLoyaltyAccount(input.customerId)
    const txnResult = await this.createFpLoyaltyTransactions([{
      account_id: account.id,
      order_id: input.orderId,
      type: "reverse",
      points_delta: -Math.abs(input.points),
      status: "committed",
      idempotency_key: input.idempotencyKey || null,
    }])
    const txn = Array.isArray(txnResult) ? txnResult[0] : txnResult
    await this.updateFpLoyaltyAccounts({
      id: account.id,
      available_points: Math.max(0, (account.available_points || 0) - Math.abs(input.points)),
    })
    return txn
  }

  calculateBundlePrice(prices: number[], fixedPrice: number) {
    const regular = prices.reduce((a, b) => a + b, 0)
    return {
      regular_total: regular,
      bundle_price: fixedPrice,
      discount_total: Math.max(0, regular - fixedPrice),
    }
  }

  async allocateDiscount(input: {
    orderId: string
    orderLineId?: string | null
    promotionApplicationId?: string | null
    fundingParty: "marketplace" | "seller"
    sellerId?: string | null
    amount: number
  }) {
    const result = await this.createFpDiscountAllocations([{
      order_id: input.orderId,
      order_line_id: input.orderLineId || null,
      promotion_application_id: input.promotionApplicationId || null,
      funding_party: input.fundingParty,
      seller_id: input.sellerId || null,
      amount: input.amount,
      status: "estimated",
    }])
    return Array.isArray(result) ? result[0] : result
  }
}

export default FpModuleService
