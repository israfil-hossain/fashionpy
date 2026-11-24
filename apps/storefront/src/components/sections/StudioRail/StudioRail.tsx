import { HttpTypes } from '@medusajs/types';

import { StudioRailClient } from '@/components/organisms/StudioRail/StudioRailClient';
import { resolveStudioRailCategories } from '@/const/studio-rail';
import { listAllCategories } from '@/lib/data/categories';
import { listProducts } from '@/lib/data/products';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import type { StudioRailGroup, StudioRailItem } from '@/types/studio-rail';

type StudioRailMetadata = {
  show_in_studio_rail?: unknown;
  studio_rail_thumbnail?: unknown;
  studio_rail_front_image?: unknown;
  studio_rail_back_image?: unknown;
};

const isEnabled = (value: unknown) => value === true || value === 'true';

const metadataUrl = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

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
  const metadata = (product.metadata ?? {}) as StudioRailMetadata;
  if (!isEnabled(metadata.show_in_studio_rail)) return null;

  const { cheapestPrice } = getProductPrice({ product });
  const gallery = distinctImages(product);
  const thumbnail = metadataUrl(metadata.studio_rail_thumbnail) ?? product.thumbnail;
  if (!thumbnail) return null;

  // The dedicated metadata images win when present. Otherwise the gallery
  // supplies the views: anything that is not the hanging shot becomes the
  // front, the next distinct shot becomes the back. Products with fewer
  // images simply reuse the thumbnail so the rail/quick view stay complete.
  const frontImage =
    metadataUrl(metadata.studio_rail_front_image) ??
    gallery.find(url => url !== thumbnail && url !== product.thumbnail) ??
    thumbnail;
  const backImage =
    metadataUrl(metadata.studio_rail_back_image) ??
    gallery.find(
      url => url !== thumbnail && url !== product.thumbnail && url !== frontImage
    ) ??
    gallery.find(url => url !== frontImage) ??
    null;

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
                  'id,title,handle,thumbnail,metadata,*images,*variants,variants.options.value,variants.options.option.title,variants.calculated_price'
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
