"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { listProducts } from "@/lib/data/products"
import { HttpTypes } from "@medusajs/types"

const STORAGE_KEY = "mercur:recently-viewed"
const MAX_ITEMS = 8

const readHandles = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((h) => typeof h === "string") : []
  } catch {
    return []
  }
}

const writeHandle = (handle: string) => {
  try {
    const next = [handle, ...readHandles().filter((h) => h !== handle)].slice(
      0,
      MAX_ITEMS
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage unavailable — section just stays empty
  }
}

/**
 * Records the current product handle on mount and renders other recently
 * viewed products (excluding the current one).
 */
export const RecentlyViewedSection = ({
  currentHandle,
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || "pl",
}: {
  currentHandle?: string
  locale?: string
}) => {
  const [handles, setHandles] = useState<string[]>([])
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])

  useEffect(() => {
    if (!currentHandle) return
    writeHandle(currentHandle)
    setHandles(readHandles().filter((h) => h !== currentHandle))
  }, [currentHandle])

  useEffect(() => {
    if (!handles.length) return
    let cancelled = false
    ;(async () => {
      try {
        const { response } = await listProducts({
          countryCode: locale,
          queryParams: { handle: handles, limit: handles.length },
        })
        if (!cancelled) {
          // Preserve recorded order (most recent first)
          const byHandle = new Map(
            response.products.map((p) => [p.handle, p])
          )
          setProducts(
            handles
              .map((h) => byHandle.get(h))
              .filter((p): p is HttpTypes.StoreProduct => !!p)
          )
        }
      } catch {
        if (!cancelled) setProducts([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [handles, locale])

  if (!handles.length || products.length === 0) return null

  return (
    <div className="my-8" data-testid="recently-viewed-section">
      <h3 className="mb-4 heading-sm uppercase">Recently viewed</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            className="w-[260px] shrink-0 sm:w-[280px]"
          />
        ))}
      </div>
    </div>
  )
}
