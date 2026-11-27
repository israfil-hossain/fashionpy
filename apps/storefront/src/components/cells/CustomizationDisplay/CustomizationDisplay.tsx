import { HttpTypes } from "@medusajs/types"

const friendlyLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase())

export const CustomizationDisplay = ({
  metadata,
}: {
  metadata?: Record<string, unknown> | null
}) => {
  const raw = metadata?.customization
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null

  const entries = Object.entries(raw as Record<string, unknown>).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  )
  if (!entries.length) return null

  return (
    <div
      className="mt-2 flex flex-col gap-1"
      data-testid="customization-display"
    >
      {entries.map(([key, value]) => {
        const file =
          typeof value === "object" &&
          value !== null &&
          "url" in value &&
          typeof (value as { url: unknown }).url === "string"

        return (
          <p key={key} className="label-sm text-secondary">
            <span className="text-primary">{friendlyLabel(key)}:</span>{" "}
            {file ? (
              <a
                href={(value as { url: string }).url}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                View file
              </a>
            ) : (
              String(value)
            )}
          </p>
        )
      })}
    </div>
  )
}

export type CustomizableLineItem = Pick<HttpTypes.StoreCartLineItem, "metadata">
