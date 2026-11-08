import { isRichText, sanitizeRichText } from "@/lib/helpers/sanitize-rich-text"

/**
 * Full seller's description (About tab). Open content — no accordion.
 */
export const ProductPageDetails = ({ details }: { details: string }) => {
  if (!details) return null

  return (
    <div data-testid="product-details-section">
      <h3 className="label-lg uppercase mb-2">Seller's description</h3>
      {isRichText(details) ? (
        <div
          className="product-details"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(details),
          }}
          data-testid="product-details-content"
        />
      ) : (
        <div
          className="product-details whitespace-pre-line"
          data-testid="product-details-content"
        >
          {details}
        </div>
      )}
    </div>
  )
}

