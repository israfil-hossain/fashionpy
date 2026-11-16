/**
 * Collections store their sort position in `metadata.rank` (0 is shown first,
 * 1 second, and so on). `null` means the collection has no rank yet.
 */
export const getCollectionRank = (
  metadata: Record<string, unknown> | null | undefined
): number | null => {
  const raw = metadata?.rank

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw
  }

  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}
