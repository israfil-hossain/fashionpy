export const isWishlistedProduct = (
  productIds: readonly string[],
  productId: string
): boolean => productIds.includes(productId)
