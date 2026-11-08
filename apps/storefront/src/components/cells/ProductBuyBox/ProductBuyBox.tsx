"use client"

import { useState } from "react"
import { Button } from '@/components/atoms/Button/Button';
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { SellerAvatar } from "@/components/cells/SellerAvatar/SellerAvatar"
import { ProductVariants } from '@/components/molecules/ProductVariants/ProductVariants';
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { convertToLocale } from "@/lib/helpers/money"
import {
  getBuyboxWinner,
  getOfferAmount,
  getOfferStock,
  getVariantOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { Chat } from "@/components/organisms/Chat/Chat"
import { CompareOffersModal } from "@/components/organisms/CompareOffersModal/CompareOffersModal"
import { SellerDTO } from "@mercurjs/types"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"
import { useCartDrawer } from "@/components/providers/Cart/drawer"
import { MinusThinIcon, PlusIcon } from "@/icons"
import { ProductDeliveryTeaser } from "@/components/cells/ProductDeliveryTeaser/ProductDeliveryTeaser"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce(
    (
      acc: Record<string, string>,
      varopt: HttpTypes.StoreProductOptionValue
    ) => {
      acc[varopt.option?.title.toLowerCase() || ""] = varopt.value

      return acc
    },
    {}
  )
}

/**
 * Sticky buy box: price, variants, quantity, add-to-cart, offer compare,
 * seller chat, and a delivery teaser. All purchase testids from the old
 * ProductDetailsHeader are preserved here.
 */
export const ProductBuyBox = ({
  product,
  locale,
  user,
  offers = [],
  seller,
}: {
  product: HttpTypes.StoreProduct
  locale: string
  user: HttpTypes.StoreCustomer | null
  offers?: StoreOffer[]
  seller?: SellerDTO
}) => {
  const { addToCart, cart, isAddingItem } = useCartContext()
  const { allSearchParams } = useGetAllSearchParams()
  const { openDrawer } = useCartDrawer()
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product,
  })

  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  const selectedVariant = hasAnyPrice
    ? {
        ...optionsAsKeymap(cheapestVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  const variantId =
    product.variants?.find(({ options }: { options: any }) =>
      options?.every((option: any) =>
        selectedVariant[option.option?.title.toLowerCase() || ""]?.includes(
          option.value
        )
      )
    )?.id || ""

  const { variantPrice } = getProductPrice({
    product,
    variantId,
  })

  // Buybox: the winning offer for the selected variant sets the price shown and
  // the offer that add-to-cart uses. Products are sold through offers, not the
  // variant's base price.
  const variantOffers = getVariantOffers(offers, variantId)
  const winnerOffer = getBuyboxWinner(variantOffers)
  const otherOffersCount = Math.max(variantOffers.length - 1, 0)

  const offerAmount = winnerOffer ? getOfferAmount(winnerOffer) : null
  const offerCurrency =
    winnerOffer?.calculated_price?.currency_code ||
    variantPrice?.currency_code ||
    "bdt"
  const offerStock = winnerOffer ? getOfferStock(winnerOffer) : 0
  const hasOffer = !!winnerOffer && offerAmount !== null

  const displayPrice = hasOffer
    ? convertToLocale({ amount: offerAmount as number, currency_code: offerCurrency })
    : variantPrice?.calculated_price

  const originalAmount =
    winnerOffer?.calculated_price?.original_amount ??
    variantPrice?.original_price_number
  const hasDiscount =
    hasOffer &&
    typeof originalAmount === "number" &&
    originalAmount > (offerAmount as number)
  const discountPct = hasDiscount
    ? Math.round(
        (((originalAmount as number) - (offerAmount as number)) /
          (originalAmount as number)) *
          100
      )
    : null
  const originalPriceLabel = hasDiscount
    ? convertToLocale({
        amount: originalAmount as number,
        currency_code: offerCurrency,
      })
    : null

  const quantityInCart =
    cart?.items?.find((item) => item.metadata?.offer_id === winnerOffer?.id)
      ?.quantity ?? 0
  const isStockMaxLimitReached = quantityInCart >= offerStock

  const isAddToCartDisabled =
    !hasOffer || !offerStock || isStockMaxLimitReached

  const maxQuantity = Math.max(1, Math.min(99, offerStock - quantityInCart))
  const selectedQuantity = Math.min(quantity, maxQuantity)

  const leadtimeDays =
    winnerOffer?.leadtime_to_ship ??
    seller?.default_leadtime_to_ship ??
    null

  const handleAddToCart = async () => {
    if (!winnerOffer || isAddToCartDisabled) return

    const total = offerAmount as number
    const subtotal =
      winnerOffer.calculated_price?.calculated_amount_without_tax ?? total

    const storeCartLineItem = {
      thumbnail: product.thumbnail || "",
      product_title: product.title,
      quantity: selectedQuantity,
      subtotal: subtotal * selectedQuantity,
      total: total * selectedQuantity,
      tax_total: (total - subtotal) * selectedQuantity,
      variant_id: variantId,
      product_id: product.id,
      variant: product.variants?.find(({ id }) => id === variantId),
      metadata: { offer_id: winnerOffer.id },
    }

    openDrawer()
    setQuantity(1)

    try {
      await addToCart({
        offerId: winnerOffer.id,
        quantity: selectedQuantity,
        countryCode: locale,
        optimisticItem: { item: storeCartLineItem, currencyCode: offerCurrency },
      })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "This offer does not have the required inventory",
      })
    }
  }

  return (
    <div
      className="border rounded-sm p-5 bg-primary sticky top-[112px]"
      data-testid="product-details-header"
    >
      {seller && (
        <div
          className="mb-3 flex items-center gap-2 border-b pb-3"
          data-testid="product-buybox-store"
        >
          <SellerAvatar photo={seller.logo || ""} size={28} alt={seller.name} />
          <LocalizedClientLink
            href={`/sellers/${seller.handle}`}
            className="label-md text-primary underline-offset-2 hover:underline"
            data-testid="product-buybox-store-link"
          >
            {seller.name}
          </LocalizedClientLink>
          {seller.is_premium && (
            <span className="label-sm rounded-xs bg-action-secondary px-1.5 py-0.5 text-action-on-secondary">
              Premium
            </span>
          )}
        </div>
      )}
      <div
        className="mb-3 label-md text-secondary"
        data-testid="product-offers-urgency"
      >
        {!hasOffer
          ? "This item is unavailable right now"
          : otherOffersCount > 0
          ? `${otherOffersCount + 1} offers available`
          : offerStock > 0 && offerStock <= 5
          ? `Only ${offerStock} left — order soon`
          : "In stock and ready to ship"}
      </div>

      <div data-testid="product-price-container">
        {hasOffer ? (
          <div className="flex flex-wrap items-baseline gap-2">
            <span
              className="heading-md text-primary"
              data-testid="product-price-current"
            >
              {displayPrice}
            </span>
            {originalPriceLabel && (
              <span
                className="label-md text-secondary line-through"
                data-testid="product-price-original"
              >
                {originalPriceLabel}
              </span>
            )}
            {discountPct && discountPct > 0 && (
              <span
                className="label-sm rounded-xs bg-positive-secondary px-1.5 py-0.5 text-positive-on-primary"
                data-testid="product-price-discount"
              >
                {discountPct}% off
              </span>
            )}
          </div>
        ) : hasAnyPrice && variantPrice ? (
          <span
            className="heading-md text-primary"
            data-testid="product-price-current"
          >
            {variantPrice.calculated_price}
          </span>
        ) : (
          <span
            className="label-md text-secondary pt-2 pb-4"
            data-testid="product-price-unavailable"
          >
            Not available in your region
          </span>
        )}
      </div>

      {hasAnyPrice && (
        <ProductVariants product={product} selectedVariant={selectedVariant} />
      )}

      <div className="mb-4 flex gap-2">
        <div
          aria-label="Item quantity"
          role="group"
          className="flex shrink-0 items-center rounded-sm border"
          data-testid="product-quantity-picker"
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            className="flex h-full w-10 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isAddToCartDisabled || selectedQuantity <= 1}
            onClick={() => setQuantity(Math.max(1, selectedQuantity - 1))}
            data-testid="product-quantity-decrease"
          >
            <MinusThinIcon size={16} />
          </button>
          <span
            aria-live="polite"
            role="status"
            className="label-md w-8 text-center tabular-nums"
            data-testid="product-quantity-value"
          >
            {selectedQuantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="flex h-full w-10 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isAddToCartDisabled || selectedQuantity >= maxQuantity}
            onClick={() => setQuantity(Math.min(maxQuantity, selectedQuantity + 1))}
            data-testid="product-quantity-increase"
          >
            <PlusIcon size={16} />
          </button>
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={isAddToCartDisabled}
          loading={isAddingItem}
          className="w-full uppercase py-3 flex justify-center"
          size="large"
          data-testid="product-add-to-cart-button"
        >
          {!hasOffer
            ? "NOT AVAILABLE"
            : offerStock
            ? "ADD TO CART"
            : "OUT OF STOCK"}
        </Button>
      </div>

      {otherOffersCount > 0 && (
        <Button
          variant="tonal"
          onClick={() => setIsCompareOpen(true)}
          className="w-full uppercase mb-4"
          data-testid="compare-offers-button"
        >
          {`Compare other ${otherOffersCount} offers`}
        </Button>
      )}

      {isCompareOpen && (
        <CompareOffersModal
          offers={variantOffers}
          locale={locale}
          variantLabel={
            product.variants?.find(({ id }) => id === variantId)?.title ||
            undefined
          }
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {user && seller && (
        <Chat
          user={user}
          seller={seller}
          buttonClassNames="w-full uppercase mb-4"
          product={product}
        />
      )}

      <ProductDeliveryTeaser leadtimeDays={leadtimeDays} />
    </div>
  )
}
