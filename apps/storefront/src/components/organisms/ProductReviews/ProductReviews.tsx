import { formatDistanceToNow } from "date-fns"
import { StarRating } from "@/components/atoms/StarRating/StarRating"
import { Card } from "@/components/atoms/Card/Card"
import { HttpTypes } from "@medusajs/types"

export type StoreReview = {
  id: string
  display_id?: number
  reference: "product" | "seller"
  rating: number
  customer_note: string | null
  seller_note: string | null
  status: "pending" | "published" | "rejected"
  customer?: {
    first_name?: string | null
    last_name?: string | null
  } | null
  created_at: string
  updated_at?: string
}

/**
 * Etsy-style reviews block. Data comes from the store reviews API
 * (published product reviews only).
 */
export const ProductReviews = ({
  reviews = [],
  seller,
}: {
  reviews?: StoreReview[]
  seller?: { name?: string } | null
}) => {
  const published = reviews.filter((r) => r.status === "published")
  const count = published.length
  const average = count
    ? published.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count
    : 0

  return (
    <section data-testid="product-reviews-section">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h2 className="heading-md" data-testid="product-reviews-heading">
          Reviews for this item
        </h2>
        {count > 0 && (
          <div
            className="flex items-center gap-2"
            data-testid="product-reviews-summary"
          >
            <span className="heading-sm" data-testid="product-reviews-average">
              {average.toFixed(1)}
            </span>
            <StarRating rate={average} starSize={16} />
            <span className="label-md text-secondary" data-testid="product-reviews-count">
              ({count} review{count === 1 ? "" : "s"})
            </span>
          </div>
        )}
      </div>

      {count === 0 ? (
        <Card className="py-6 text-center" data-testid="product-reviews-empty">
          <p className="label-md text-secondary">
            No reviews yet. Be the first to share your experience.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4" data-testid="product-reviews-list">
          {published.map((review) => {
            const name =
              [review.customer?.first_name, review.customer?.last_name]
                .filter(Boolean)
                .join(" ") || "Verified buyer"

            return (
              <li key={review.id} data-testid={`product-review-${review.id}`}>
                <Card className="py-4">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <StarRating rate={Number(review.rating)} starSize={14} />
                    <span className="label-md text-primary">{name}</span>
                    <span className="label-sm text-secondary">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {review.customer_note && (
                    <p
                      className="text-md text-primary whitespace-pre-line break-words"
                      data-testid={`product-review-note-${review.id}`}
                    >
                      {review.customer_note}
                    </p>
                  )}
                  {review.seller_note && (
                    <div
                      className="mt-3 border-l-2 border-tertiary pl-3"
                      data-testid={`product-review-reply-${review.id}`}
                    >
                      <p className="label-md text-primary">
                        Response from {seller?.name || "seller"}
                      </p>
                      <p className="label-sm text-secondary mt-1 whitespace-pre-line">
                        {review.seller_note}
                      </p>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
