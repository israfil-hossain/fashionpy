import type { HttpTypes } from "@medusajs/types"

export type CategoryMediaImage = {
  id: string
  url: string
  type?: string | null
  is_thumbnail?: boolean | null
  is_banner?: boolean | null
  rank?: number | null
}

export type CategoryWithMedia = HttpTypes.StoreProductCategory & {
  media_images?: CategoryMediaImage[]
  category_children?: CategoryWithMedia[]
}

export type CategoryTreeNode = CategoryWithMedia & {
  category_children: CategoryTreeNode[]
}

const byRank = (a: { rank?: number | null; name: string }, b: { rank?: number | null; name: string }) =>
  (a.rank ?? 0) - (b.rank ?? 0) || a.name.localeCompare(b.name)

/**
 * Rank-ordered tree from a flat category list. Children are grouped by
 * `parent_category_id` so nested categories keep their own media and ordering
 * at any depth.
 */
export const buildCategoryTree = (all: CategoryWithMedia[]): CategoryTreeNode[] => {
  const childrenByParent = new Map<string | null, CategoryTreeNode[]>()

  for (const category of all) {
    const parentId = category.parent_category_id ?? null
    const node = { ...category, category_children: [] } as CategoryTreeNode
    const bucket = childrenByParent.get(parentId)
    if (bucket) {
      bucket.push(node)
    } else {
      childrenByParent.set(parentId, [node])
    }
  }

  const attach = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    nodes.sort(byRank)
    for (const node of nodes) {
      node.category_children = attach(childrenByParent.get(node.id) ?? [])
    }
    return nodes
  }

  return attach(childrenByParent.get(null) ?? [])
}

/** Root-to-leaf handles for a category, e.g. `["sneakers", "high-top"]`. */
export const findCategoryTrail = (
  handle: string,
  tree: CategoryTreeNode[]
): string[] => {
  const walk = (nodes: CategoryTreeNode[], path: string[]): string[] | null => {
    for (const node of nodes) {
      const nextPath = [...path, node.handle]
      if (node.handle === handle) return nextPath
      const found = walk(node.category_children, nextPath)
      if (found) return found
    }
    return null
  }

  return walk(tree, []) ?? []
}
