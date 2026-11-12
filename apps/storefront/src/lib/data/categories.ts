'use server';

import { HttpTypes } from '@medusajs/types';

import { sdk } from '@/lib/client';
import {
  buildCategoryTree,
  type CategoryTreeNode,
  type CategoryWithMedia,
} from '@/lib/helpers/category-tree';
import { CACHE_TAGS, getCatalogFetchOptions } from './cache-tags';

const CATEGORY_MEDIA_FIELDS = [
  'media_images.id',
  'media_images.url',
  'media_images.type',
  'media_images.is_thumbnail',
  'media_images.is_banner',
  'media_images.rank',
].join(',');

const CATEGORY_CHILD_MEDIA_FIELDS = CATEGORY_MEDIA_FIELDS.split(',')
  .map((field) => `category_children.${field}`)
  .join(',');

const CATEGORY_TREE_FIELDS = [
  'id,handle,name,rank,metadata,parent_category_id,description',
  CATEGORY_MEDIA_FIELDS,
  '*category_children',
  CATEGORY_CHILD_MEDIA_FIELDS,
].join(',');

interface CategoriesProps {
  query?: Record<string, unknown>;
}

export const listCategories = async ({ query }: Partial<CategoriesProps> = {}) => {
  const limit = query?.limit || 100;

  const allCategories = await (sdk.store.productCategories
    .query({
      fields: CATEGORY_TREE_FIELDS,
      include_descendants_tree: true,
      include_ancestors_tree: true,
      limit,
      ...query,
      fetchOptions: getCatalogFetchOptions(CACHE_TAGS.categories)
    } as never) as unknown as Promise<{ product_categories: CategoryWithMedia[] }>)
    .then(({ product_categories }) => product_categories);

  const parentCategories = allCategories.filter(cat => !cat.parent_category_id);

  const mainCategories = parentCategories.flatMap(parent => parent.category_children || []);

  const mainCategoriesWithChildren = mainCategories.map(mainCat => {
    const children = allCategories.filter(cat => cat.parent_category_id === mainCat.id);

    if (children.length > 0) {
      return {
        ...mainCat,
        category_children: children
      };
    }

    return mainCat;
  });

  return {
    parentCategories,
    categories: mainCategoriesWithChildren
  };
};

/**
 * Every active category as a rank-ordered tree, used by the category-page
 * sidebar. Shares the `categories` cache tag with the other catalog reads.
 */
export const listCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  const { product_categories: all } = await (sdk.store.productCategories
    .query({
      fields: CATEGORY_TREE_FIELDS,
      limit: 100,
      fetchOptions: getCatalogFetchOptions(CACHE_TAGS.categories)
    } as never) as unknown as Promise<{ product_categories: CategoryWithMedia[] }>);

  return buildCategoryTree(all);
};

export const getCategoryByHandle = async (categoryHandle: string) => {
  return (sdk.store.productCategories
    .query({
      fields: CATEGORY_TREE_FIELDS,
      handle: categoryHandle,
      include_descendants_tree: true,
      fetchOptions: getCatalogFetchOptions(
        CACHE_TAGS.categories,
        CACHE_TAGS.category(categoryHandle)
      )
    } as never) as unknown as Promise<HttpTypes.StoreProductCategoryListResponse>)
    .then(({ product_categories }) => product_categories[0]);
};

// Medusa's `/store/products?category_id=` filters by the exact category only —
// it does not walk into descendants. To make a parent category page list every
// product beneath it, collect the whole subtree of ids and pass them all.
export const collectCategorySubtreeIds = async (
  category: Pick<HttpTypes.StoreProductCategory, 'id' | 'category_children'>
): Promise<string[]> => {
  const ids = [category.id];
  for (const child of category.category_children ?? []) {
    ids.push(...(await collectCategorySubtreeIds(child)));
  }
  return ids;
};
