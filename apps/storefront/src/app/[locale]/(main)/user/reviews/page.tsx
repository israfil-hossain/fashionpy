import { Suspense } from "react"
import { Badge, Card, StarRating } from "@/components/atoms"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { UserPanelBell } from "@/components/molecules/UserPanelBell/UserPanelBell"
import { retrieveCustomer } from "@/lib/data/customer"
import { listMyReviews, MyReview } from "@/lib/data/reviews"

export default function ReviewsPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ReviewsPageContent />
    </Suspense>
  )
}

const statusLabel = (status: MyReview["status"]): string => {
  if (status === "published") return "Published"
  if (status === "pending") return "Pending approval"
  return "Rejected"
}

async function ReviewsPageContent() {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  const reviews = await listMyReviews()

  return (
    <main className="container" data-testid="reviews-page">
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserNavigation />
        <div className="space-y-4 md:col-span-3">
          <div className="flex items-center gap-3">
            <UserPanelBell />
            <h1 className="heading-md uppercase">Reviews</h1>
          </div>

          {reviews.length === 0 ? (
            <Card className="p-8 text-center" data-testid="reviews-empty">
              <p className="text-secondary">No reviews yet.</p>
              <p className="label-sm text-secondary mt-1">
                Reviews you write after a delivery will show up here.
              </p>
            </Card>
          ) : (
            <div className="space-y-4" data-testid="reviews-list">
              {reviews.map((review) => (
                <Card
                  key={review.id}
                  className="flex flex-col gap-2 p-4"
                  data-testid={`review-${review.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating rate={review.rating} starSize={16} />
                      <Badge>
                        {review.reference === "seller" ? "Seller" : "Product"}
                      </Badge>
                      <span className="label-sm text-secondary">
                        {statusLabel(review.status)}
                      </span>
                    </div>
                    <span className="label-sm text-secondary">
                      {review.display_id
                        ? `Review #${review.display_id}`
                        : new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.customer_note && (
                    <p className="text-sm text-primary" data-testid="review-note">
                      {review.customer_note}
                    </p>
                  )}
                  {review.seller_note && (
                    <p className="label-sm text-secondary">
                      Seller reply: {review.seller_note}
                    </p>
                  )}
                  <span className="label-sm text-secondary">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
