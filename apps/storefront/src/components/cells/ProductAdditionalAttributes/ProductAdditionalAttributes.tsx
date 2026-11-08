import { AdditionalAttributeProps } from "@/types/product"

/**
 * Key/value specification table (About tab). Always open — no accordion.
 */
export const ProductAdditionalAttributes = ({
  attributes,
}: {
  attributes: AdditionalAttributeProps[]
}) => {
  const nonEmptyAttributes = (attributes || []).filter(
    (attribute) => !!attribute && attribute.id && attribute.value
  )

  if (!nonEmptyAttributes.length) return null

  return (
    <div data-testid="product-additional-attributes-section">
      <h3 className="label-lg uppercase mb-2">Specifications</h3>
      <div className="border rounded-sm overflow-hidden">
        {nonEmptyAttributes.map((attribute) => (
          <div
            key={attribute.id}
            className="grid grid-cols-2 border-b last:border-b-0 label-md"
            data-testid={`product-attribute-${attribute.attribute?.name
              ?.toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            <div className="border-r px-3 py-2.5 text-secondary bg-component-secondary">
              {attribute.attribute?.name}
            </div>
            <div className="px-3 py-2.5 text-primary">{attribute.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

