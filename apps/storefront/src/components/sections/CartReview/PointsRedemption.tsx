"use client"

import { useState } from "react"

import { Button, Input } from "@/components/atoms"
import { toast } from "@/lib/helpers/toast"
import {
  applyPointsToCart,
  estimatePointsRedemption,
} from "@/lib/data/rewards"

export const PointsRedemption = ({
  cartId,
  itemSubtotal,
  availablePoints,
}: {
  cartId: string
  itemSubtotal: number
  availablePoints: number
}) => {
  const [points, setPoints] = useState("")
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState<number | null>(null)

  const handleApply = async () => {
    const value = Number(points)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error({ title: "Enter a valid points amount" })
      return
    }

    setLoading(true)
    const estimate = await estimatePointsRedemption(value, itemSubtotal)
    if (!estimate || estimate.status !== "eligible") {
      setLoading(false)
      toast.error({ title: "Not enough points", description: "Try a smaller amount." })
      return
    }

    const result = await applyPointsToCart(cartId, value)
    setLoading(false)
    if (!result.success) {
      toast.error({ title: "Could not apply points", description: result.message })
      return
    }

    setApplied(result.discount_bdt ?? 0)
    toast.success({ title: "Points applied", description: `You saved ৳${result.discount_bdt}` })
  }

  if (applied !== null) {
    return (
      <div className="rounded-sm border p-4" data-testid="points-applied">
        <p className="label-md text-primary">
          ৳{applied} discount applied from your points.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-sm border p-4" data-testid="points-redemption">
      <div className="min-w-[140px] flex-1">
        <label className="label-sm text-secondary" htmlFor="points-input">
          Use points ({availablePoints} available)
        </label>
        <Input
          id="points-input"
          type="number"
          min={100}
          step={100}
          value={points}
          placeholder="100"
          onChange={event => setPoints(event.target.value)}
          data-testid="points-input"
        />
      </div>
      <Button
        type="button"
        onClick={() => void handleApply()}
        disabled={loading || availablePoints < 100}
        isLoading={loading}
        data-testid="points-apply"
      >
        Apply
      </Button>
      <p className="w-full label-sm text-secondary">
        100 points = ৳10 off, up to 10% of your item subtotal.
      </p>
    </div>
  )
}
