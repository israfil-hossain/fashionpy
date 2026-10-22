"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/organisms/ProductCard/ProductCard"
import { convertToLocale } from "@/lib/helpers/money"

export const RecentlyViewedSection = ({ recordedIds }: { recordedIds: string[] }) => {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    // Fetch product details for each recorded ID
    ;(async () => {
      const fetched: any[] = []
      for (const id of recordedIds) {
        try {
          const { response } = await (await import("@/lib/data/products")).listProducts({
            countryCode: "en",
            queryParams: { handle: id, limit: 1 },
          })
          if (response.products[0]) fetched.push(response.products[0])
        } catch {}
      }
      setProducts(fetched)
    })()
  }, [recordedIds])

  return recordedIds.length > 0 ? (
    <div className="my-8">
      <h3 className="text-sm font-medium text-gray-600 mb-3">Recently Viewed</h3>
      <div className="flex gap-2 overflow-x-auto">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              className="min-w-[200px]"
            />
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center h-24 text-gray-400">
            No products found
          </div>
        )}
      </div>
    </div>
  ) : null
}