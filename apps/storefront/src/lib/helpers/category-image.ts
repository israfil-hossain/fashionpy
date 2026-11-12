import type { CategoryMediaImage, CategoryWithMedia } from '@/lib/helpers/category-tree';

export const CATEGORY_STATIC_IMAGE_PREFIX = '/images/categories/';
export const CATEGORY_IMAGE_FALLBACK = '/images/placeholder.svg';

/** Static file shipped with the storefront, used when a category has no media. */
export const getStaticCategoryImage = (handle: string): string =>
  `${CATEGORY_STATIC_IMAGE_PREFIX}${handle}.png`;

const byRank = (a: CategoryMediaImage, b: CategoryMediaImage) =>
  (a.rank ?? 0) - (b.rank ?? 0);

const firstMatch = (
  images: CategoryMediaImage[],
  predicate: (image: CategoryMediaImage) => boolean
): string | null =>
  images.filter(predicate).sort(byRank)[0]?.url ?? null;

/**
 * Image for a category card: admin thumbnail first, then banner, then any
 * non-icon media, then the icon. Falls back to the static file shipped with
 * the storefront, which the `CategoryImage` component swaps for a placeholder
 * when the file does not exist.
 */
export const getCategoryImage = (category: CategoryWithMedia): string => {
  const images = (category.media_images ?? []).filter((image) => image.url);

  return (
    firstMatch(images, (image) => !!image.is_thumbnail) ??
    firstMatch(images, (image) => !!image.is_banner) ??
    firstMatch(images, (image) => image.type !== 'icon') ??
    firstMatch(images, () => true) ??
    getStaticCategoryImage(category.handle)
  );
};

/**
 * Image for the circular category strip: the admin icon is the intended
 * "near the label" asset, so it wins here over the gallery images.
 */
export const getCategoryAvatarImage = (category: CategoryWithMedia): string => {
  const images = (category.media_images ?? []).filter((image) => image.url);

  return (
    firstMatch(images, (image) => image.type === 'icon') ??
    firstMatch(images, (image) => !!image.is_thumbnail) ??
    firstMatch(images, (image) => !!image.is_banner) ??
    firstMatch(images, () => true) ??
    getStaticCategoryImage(category.handle)
  );
};
