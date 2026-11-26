import type { OfferDTO } from "@mercurjs/types"

type OfferRow = Pick<OfferDTO, "id" | "offer_ids">

export const resolveOfferIdsForSelection = (
  rows: readonly OfferRow[],
  selection: Record<string, boolean>
): string[] => {
  const selectedIds = Object.keys(selection).filter(id => selection[id])
  const offerIds = new Set<string>()

  for (const id of selectedIds) {
    const row = rows.find(candidate => candidate.id === id)
    const ids = row?.offer_ids?.length ? row.offer_ids : [id]
    for (const offerId of ids) {
      offerIds.add(offerId)
    }
  }

  return [...offerIds]
}
