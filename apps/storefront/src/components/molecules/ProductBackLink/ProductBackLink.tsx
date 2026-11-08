"use client"

import { cn } from "@/lib/utils"
import { ArrowLeftIcon } from "@/icons"
import { useRouter } from "next/navigation"

/**
 * "Back to results" control above the PDP. Uses history when available so
 * filters/sort are preserved, otherwise falls back to the categories index.
 */
export const ProductBackLink = ({ className }: { className?: string }) => {
  const router = useRouter()

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/categories")
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 label-md text-secondary hover:text-primary transition-colors",
        className
      )}
      data-testid="product-back-link"
    >
      <ArrowLeftIcon size={16} />
      Back to results
    </button>
  )
}
