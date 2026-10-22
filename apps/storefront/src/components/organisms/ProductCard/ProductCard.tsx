"use client"

import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@/lib/utils"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { Product } from "@/types/product"

export const ProductCard = ({
  product,
  className,
  imageAspect = "landscape",
}: {
  product: HttpTypes.StoreProduct | Product,
  className?: string
  imageAspect?: "landscape" | "portrait"
}) => {
  if (!product) {
    return null
  }

  const { cheapestPrice } = getProductPrice({ product: product as HttpTypes.StoreProduct })

  // Compute discount percentage from numeric prices
  let discountPct: number | null = null
  if (
    cheapestPrice?.original_price_number &&
    cheapestPrice?.calculated_price_number &&
    cheapestPrice.original_price_number > cheapestPrice.calculated_price_number
  ) {
    discountPct = Math.round(
      ((cheapestPrice.original_price_number -
        cheapestPrice.calculated_price_number) /
        cheapestPrice.original_price_number) *
        100
    )
  }

  const productName = String(product.title || "Product")

  return (
    <div
      className={cn(
        "relative w-full rounded-lg p-0 bg-white flex flex-col gap-2",
        className
      )}
      data-testid="product-card"
      data-product-handle={product.handle}
    >
      <div
        className={cn(
          "relative w-full rounded-t-lg overflow-hidden bg-gray-100",
          imageAspect === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
        )}
        data-testid="product-card-image-container"
      >
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          aria-label={`View ${productName}`}
          title={`View ${productName}`}
          data-testid="product-card-link"
        >
          <div className="absolute inset-0">
            {product.thumbnail ? (
              <Image
                priority
                fetchPriority="high"
                src={decodeURIComponent(product.thumbnail)}
                alt={`${productName} image`}
                className="object-cover w-full h-full transition-transform duration-300 ease-out hover:scale-110"
                width={600}
                height={600}
              />
            ) : (
              <Image
                priority
                fetchPriority="high"
                src="/images/placeholder.svg"
                alt={`${productName} image placeholder`}
                className="object-cover w-full h-full"
                width={600}
                height={600}
              />
            )}
          </div>
          {discountPct !== null && (
            <span
              className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded"
            >
              -{discountPct}% OFF
            </span>
          )}
          {/* Wishlist button omitted for clean card layout */}
        </LocalizedClientLink>
      </div>
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        aria-label={`Go to ${productName} page`}
        title={`Go to ${productName} page`}
      >
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="font-medium text-primary">{cheapestPrice?.calculated_price}</p>
            {cheapestPrice?.original_price_number &&
              cheapestPrice.calculated_price_number <
                cheapestPrice.original_price_number && (
                <span className="text-xs text-gray-500 line-through mr-1">
                  {cheapestPrice.original_price}
                </span>
              )}
            {discountPct !== null && (
              <span className="text-xs text-green-600">{`-${discountPct}% OFF`}</span>
            )}
          </div>
        </div>
      </LocalizedClientLink>
    </div>
  )
}
