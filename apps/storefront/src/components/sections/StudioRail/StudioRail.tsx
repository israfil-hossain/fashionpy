import { HttpTypes } from '@medusajs/types';

import { StudioRailClient } from '@/components/organisms/StudioRail/StudioRailClient';
import { resolveStudioRailCategories } from '@/const/studio-rail';
import { listAllCategories } from '@/lib/data/categories';
import { listProducts } from '@/lib/data/products';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import type { StudioRailGroup, StudioRailItem } from '@/types/studio-rail';

const toRailItem = (product: HttpTypes.StoreProduct): StudioRailItem | null => {
  if (!product.thumbnail) return null;

  const { cheapestPrice } = getProductPrice({ product });

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    thumbnail: product.thumbnail,
    price: cheapestPrice?.calculated_price,
    originalPrice:
      cheapestPrice && cheapestPrice.calculated_price !== cheapestPrice.original_price
        ? cheapestPrice.original_price
        : undefined
  };
};

export const StudioRail = async ({
  locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'bd',
  activeKey
}: {
  locale?: string;
  activeKey?: string;
}) => {
  try {
    const categories = await listAllCategories();
    const resolved = resolveStudioRailCategories(categories);

    if (!resolved.length) {
      return null;
    }

    const groups = (
      await Promise.all(
        resolved.map(async ({ tab, category }) => {
          try {
            const {
              response: { products }
            } = await listProducts({
              countryCode: locale,
              category_id: category.id,
              queryParams: {
                limit: 12,
                order: '-created_at',
                fields: 'id,title,handle,thumbnail,*variants,variants.calculated_price'
              }
            });

            const items = products
              .map(toRailItem)
              .filter((item): item is StudioRailItem => Boolean(item));

            return items.length ? { key: tab.key, label: tab.label, items } : null;
          } catch {
            return null;
          }
        })
      )
    ).filter((group): group is StudioRailGroup => Boolean(group));

    if (!groups.length) {
      return null;
    }

    return (
      <StudioRailClient
        groups={groups}
        activeKey={activeKey}
      />
    );
  } catch {
    return null;
  }
};
