import { SellerDTO } from "@mercurjs/types"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ProductShare } from "@/components/molecules/ProductShare/ProductShare"
import { AdditionalAttributeProps } from "@/types/product"

const HIGHLIGHT_LIMIT = 5

/**
 * Middle column of the PDP top section: title, seller line, item
 * highlights (attribute bullets), and a short description with a jump to
 * the full About section below.
 */
export const ProductInfoColumn = ({
  product,
  seller,
}: {
  product: HttpTypes.StoreProduct & {
    attribute_values?: AdditionalAttributeProps[]
  }
  seller?: SellerDTO
}) => {
  const highlights = (product.attribute_values || [])
    .filter((attr) => !!attr && attr.id && attr.value)
    .slice(0, HIGHLIGHT_LIMIT)

  const shortDescription = (product.description || "").replace(
    /<[^>]*>/g,
    " "
  ).replace(/\s+/g, " ").trim()

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="product-info-column"
    >
      <div>
        <h1
          className="heading-lg text-primary"
          data-testid="product-title"
        >
          {product.title}
        </h1>
        {seller && (
          <div
            className="mt-2 flex flex-wrap items-center gap-2"
            data-testid="product-brand-line"
          >
            <span className="label-md text-secondary">Brand</span>
            <LocalizedClientLink
              href={`/sellers/${seller.handle}`}
              className="label-md text-primary underline-offset-2 hover:underline"
              data-testid="product-seller-link"
            >
              {seller.name}
            </LocalizedClientLink>
            {seller.is_premium && (
              <span
                className="label-sm rounded-xs bg-action-secondary px-1.5 py-0.5 text-action-on-secondary"
                data-testid="product-seller-premium"
              >
                Premium
              </span>
            )}
          </div>
        )}
        <div className="mt-3">
          <ProductShare title={product.title} />
        </div>
      </div>

      {highlights.length > 0 && (
        <div data-testid="product-item-highlights">
          <h2 className="label-lg uppercase mb-2">Item highlights</h2>
          <ul className="flex flex-col gap-1.5">
            {highlights.map((attr) => (
              <li
                key={attr.id}
                className="label-md text-secondary flex gap-2"
                data-testid={`product-highlight-${attr.attribute?.name
                  ?.toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <span aria-hidden className="text-primary">·</span>
                <span>
                  <span className="text-primary">{attr.attribute?.name}:</span>{" "}
                  {attr.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shortDescription && (
        <div data-testid="product-short-description">
          <h2 className="label-lg uppercase mb-2">Description</h2>
          <p className="label-md text-secondary line-clamp-4">
            {shortDescription}
          </p>
          <a
            href="#product-details-section"
            className="mt-1 inline-block label-md text-primary underline underline-offset-2"
            data-testid="product-description-view-more"
          >
            View more
          </a>
        </div>
      )}
    </div>
  )
}
