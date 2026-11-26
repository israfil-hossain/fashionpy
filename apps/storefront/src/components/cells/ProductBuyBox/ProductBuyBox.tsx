"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { InfoIcon, MessageIcon, MinusThinIcon, PlusIcon } from "@/icons"
import { startOrderConversation } from "@/lib/data/messages"
import { ProductDeliveryTeaser } from "@/components/cells/ProductDeliveryTeaser/ProductDeliveryTeaser"
import { SizeGuideDrawer } from "@/components/molecules/SizeGuideDrawer/SizeGuideDrawer"
import { getSizeChart } from "@/lib/helpers/get-size-chart"

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
  const router = useRouter()
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const sizeChart = getSizeChart(product.metadata)

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product,
  })

  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  const requiredOptionKeys = (product.options ?? [])
    .map((option) => option.title?.toLowerCase())
    .filter((key): key is string => !!key)
  const onlyVariant =
    product.variants?.length === 1 ? product.variants[0] : undefined

  const selectedVariant = onlyVariant
    ? {
        ...optionsAsKeymap(onlyVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  const isSelectionMissing =
    requiredOptionKeys.length > 0 &&
    !onlyVariant &&
    !requiredOptionKeys.every((key) => !!allSearchParams[key])

  const variantId =
    product.variants?.find(({ options }: { options: any }) =>
      options?.every((option: any) =>
        selectedVariant[option.option?.title.toLowerCase() || ""] ===
        option.value
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
    !hasOffer || !offerStock || isStockMaxLimitReached || isSelectionMissing

  const ctaLabel = isSelectionMissing
    ? "Select options"
    : offerStock
    ? "Add to cart"
    : "Out of stock"

  const maxQuantity = Math.max(1, Math.min(99, offerStock - quantityInCart))
  const selectedQuantity = Math.min(quantity, maxQuantity)

  const leadtimeDays =
    winnerOffer?.leadtime_to_ship ??
    seller?.default_leadtime_to_ship ??
    null

  const addSelectedOffer = async (showCartDrawer: boolean) => {
    if (!winnerOffer || isAddToCartDisabled) return false

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

    if (showCartDrawer) {
      openDrawer()
    }
    setQuantity(1)

    try {
      await addToCart({
        offerId: winnerOffer.id,
        quantity: selectedQuantity,
        countryCode: locale,
        optimisticItem: { item: storeCartLineItem, currencyCode: offerCurrency },
      })
      return true
    } catch {
      toast.error({
        title: "Error adding to cart",
        description: "This offer does not have the required inventory",
      })
      return false
    }
  }

  const handleBuyNow = async () => {
    const added = await addSelectedOffer(false)
    if (added) {
      router.push(`/${locale}/checkout`)
    }
  }

  return (
    <div
      className="border rounded-sm p-5 bg-primary sticky top-[112px]"
      data-testid="product-details-header"
    >
      {seller && user && (
        <button
          type="button"
          onClick={async () => {
            const result = await startOrderConversation({
              mode: "seller",
              sellerId: seller.id,
            })
            if (result.success && result.conversationId) {
              router.push(`/${locale}/user/messages?c=${result.conversationId}`)
            } else {
              toast.error({
                title: "Message not sent",
                description: result.message || "Please try again.",
              })
            }
          }}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-sm border py-2 label-md"
          data-testid="product-message-seller"
        >
          <MessageIcon size={16} />
          Message seller
        </button>
      )}
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
      {isSelectionMissing ? (
        <div
          className="mb-4 flex items-start gap-3 rounded-sm border border-warning-secondary bg-warning-secondary/60 p-4"
          data-testid="product-selection-notice"
        >
          <span className="mt-0.5 shrink-0 text-warning">
            <InfoIcon size={18} color="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="label-md font-medium text-primary">
              Select {requiredOptionKeys.join(" and ")} to continue
            </p>
            <p className="label-sm mt-1 text-secondary">
              Choose your options to see price and availability.
            </p>
          </div>
        </div>
      ) : !hasOffer ? (
        <div
          className="mb-4 flex items-start gap-3 rounded-sm border border-warning-secondary bg-warning-secondary/60 p-4"
          data-testid="product-unavailable-notice"
        >
          <span className="mt-0.5 shrink-0 text-warning">
            <InfoIcon size={18} color="currentColor" />
          </span>
          <div className="min-w-0">
            <p
              className="label-md font-medium text-primary"
              data-testid="product-offers-urgency"
            >
              This item is unavailable right now
            </p>
            <p
              className="label-sm mt-1 text-secondary"
              data-testid="product-price-unavailable"
            >
              Not available in your region
            </p>
          </div>
        </div>
      ) : (
        <div
          className="mb-3 label-md text-secondary"
          data-testid="product-offers-urgency"
        >
          {otherOffersCount > 0
            ? `${otherOffersCount + 1} offers available`
            : offerStock > 0 && offerStock <= 5
            ? `Only ${offerStock} left — order soon`
            : "In stock and ready to ship"}
        </div>
      )}

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
        ) : null}
      </div>

      {hasAnyPrice && (
        <ProductVariants product={product} selectedVariant={selectedVariant} />
      )}

      {sizeChart && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="rounded-xs bg-[rgba(var(--brand-25))] px-3 py-1.5 label-md cursor-pointer text-[rgba(var(--brand-500))]"
            data-testid="size-guide-trigger"
          >
            Size Guide
          </button>
        </div>
      )}

      {hasOffer || isSelectionMissing ? (
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
              onClick={() =>
                setQuantity(Math.min(maxQuantity, selectedQuantity + 1))
              }
              data-testid="product-quantity-increase"
            >
              <PlusIcon size={16} />
            </button>
          </div>
          <Button
            onClick={() => addSelectedOffer(true)}
            disabled={isAddToCartDisabled}
            loading={isAddingItem}
            className="hidden w-full justify-center py-3 uppercase lg:flex"
            size="large"
            data-testid="product-add-to-cart-button"
          >
            {ctaLabel}
          </Button>
        </div>
      ) : (
        <div className="mb-4">
          <Button
            disabled
            className="hidden w-full justify-center py-3 lg:flex"
            size="large"
            data-testid="product-add-to-cart-button"
          >
            Currently unavailable
          </Button>
        </div>
      )}

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

      {sizeChart && (
        <SizeGuideDrawer
          open={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          title={product.title}
          thumbnail={product.thumbnail}
          priceLabel={hasOffer ? displayPrice : variantPrice?.calculated_price}
          originalPriceLabel={originalPriceLabel}
          stock={hasOffer ? offerStock : undefined}
          sizeChart={sizeChart}
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

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] backdrop-blur-md lg:hidden"
        data-testid="product-mobile-buy-bar"
      >
        <div className="mx-auto flex max-w-[520px] items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="label-sm uppercase tracking-wide text-secondary">
              Price
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="truncate text-lg font-semibold tabular-nums text-[rgb(var(--brand-600))]">
                {displayPrice ?? "—"}
              </span>
              {originalPriceLabel && (
                <span className="label-sm shrink-0 text-secondary line-through">
                  {originalPriceLabel}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="tonal"
            size="large"
            onClick={handleBuyNow}
            disabled={isAddToCartDisabled || isAddingItem}
            className="h-11 shrink-0 rounded-full border border-[rgb(var(--brand-200))] bg-white px-4 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--brand-600))] shadow-sm transition-all hover:bg-[rgb(var(--brand-50))]"
            data-testid="product-buy-now-button"
          >
            Buy now
          </Button>
          <Button
            size="large"
            onClick={() => addSelectedOffer(true)}
            disabled={isAddToCartDisabled}
            loading={isAddingItem}
            className="h-11 shrink-0 rounded-full bg-gradient-to-r from-[rgb(var(--brand-500))] to-[#e2578c] px-4 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition-all hover:brightness-105"
            data-testid="product-mobile-add-to-cart-button"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
