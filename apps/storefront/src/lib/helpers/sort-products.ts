import { HttpTypes } from '@medusajs/types';
import { SortOptions } from '@/types/product';

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number;
  _discount?: number;
}

// Sorts by price client-side until the store API supports ordering by price.
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const sortedProducts = products as MinPricedProduct[];

  if (['price_asc', 'price_desc'].includes(sortBy)) {
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) =>
              variant?.calculated_price
                ?.calculated_amount || 0
          )
        );
      } else {
        product._minPrice = Infinity;
      }
    });

    sortedProducts.sort((a, b) => {
      const diff = a._minPrice! - b._minPrice!;
      return sortBy === 'price_asc' ? diff : -diff;
    });
  }

  if (sortBy === 'created_at') {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() -
        new Date(a.created_at!).getTime()
      );
    });
  }

  if (sortBy === 'discount') {
    sortedProducts.forEach((product) => {
      const discounts = (product.variants ?? []).map((variant) => {
        const price = variant?.calculated_price as
          | { original_amount?: number | null; calculated_amount?: number | null }
          | null
          | undefined;
        const original = Number(price?.original_amount ?? 0);
        const current = Number(price?.calculated_amount ?? 0);
        return original > current ? (original - current) / original : 0;
      });
      product._discount = discounts.length ? Math.max(...discounts) : 0;
    });

    sortedProducts.sort((a, b) => (b._discount ?? 0) - (a._discount ?? 0));
  }

  return sortedProducts;
}
