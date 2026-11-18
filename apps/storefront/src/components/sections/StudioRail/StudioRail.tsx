import { HttpTypes } from '@medusajs/types';

import { StudioRailClient } from '@/components/organisms/StudioRail/StudioRailClient';
import { resolveStudioRailCategories } from '@/const/studio-rail';
import { listAllCategories } from '@/lib/data/categories';
import { listProducts } from '@/lib/data/products';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import type { StudioRailGroup, StudioRailItem } from '@/types/studio-rail';

const distinctImages = (product: HttpTypes.StoreProduct): string[] => {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const image of product.images ?? []) {
    if (image.url && !seen.has(image.url)) {
      seen.add(image.url);
      urls.push(image.url);
    }
  }

  if (product.thumbnail && !seen.has(product.thumbnail)) {
    urls.push(product.thumbnail);
  }

  return urls;
};

const toRailItem = (product: HttpTypes.StoreProduct): StudioRailItem | null => {
  if (!product.thumbnail) return null;

  const { cheapestPrice } = getProductPrice({ product });
  const images = distinctImages(product);
  const thumbnail = product.thumbnail;

  // The rail hangs the thumbnail (the side/on-hanger shot); the quick view and
  // the hover reveal use the remaining shots — first differing image = front,
  // the one after it = back, falling back to the thumbnail so two-image
  // products still offer both views. Single-image products keep the thumbnail.
  const frontImage = images.find(url => url !== thumbnail) ?? thumbnail;
  const backImage =
    images.find(url => url !== frontImage && url !== thumbnail) ??
    images.find(url => url !== frontImage);

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    thumbnail,
    frontImage,
    backImage,
    variants: (product.variants ?? []).map(variant => ({
      id: variant.id,
      title: variant.title,
      options: (variant.options ?? []).map(option => ({
        value: option.value,
        option: { title: option.option?.title }
      }))
    })),
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
                fields:
                  'id,title,handle,thumbnail,*images,*variants,variants.options.value,variants.options.option.title,variants.calculated_price'
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
        locale={locale}
      />
    );
  } catch {
    return null;
  }
};
