type SellerRegion = {
  id: string
}

export type SellerRegionInfo = {
  id: string
  regions?: SellerRegion[] | null
}

export const getRemovableSellers = (
  selectedIds: string[],
  sellers: SellerRegionInfo[]
) => {
  const sellersById = new Map(sellers.map((seller) => [seller.id, seller]))
  const removable: string[] = []
  const blocked: string[] = []

  for (const id of selectedIds) {
    const regions = sellersById.get(id)?.regions

    if (regions && regions.length <= 1) {
      blocked.push(id)
    } else {
      removable.push(id)
    }
  }

  return { removable, blocked }
}
