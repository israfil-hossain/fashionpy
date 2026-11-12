"use client"

import { useState } from "react"

import { ArrowDownIcon } from "@/icons"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import type { CategoryTreeNode } from "@/lib/helpers/category-tree"

const ROOT_LINK_CLASSES =
  "label-md uppercase flex-1 py-1.5 text-primary transition-colors hover:text-[rgb(var(--brand-600))]"

type CategoryTreeProps = {
  tree: CategoryTreeNode[]
  activeHandle?: string | null
  /** Root-to-leaf handles of the active category, used to expand the branch. */
  activeTrail?: string[]
  className?: string
}

export function CategoryTree({
  tree,
  activeHandle,
  activeTrail = [],
  className,
}: CategoryTreeProps) {
  const [openHandles, setOpenHandles] = useState<string[]>(() => [
    ...activeTrail.slice(0, -1),
  ])

  const toggle = (handle: string) => {
    setOpenHandles((current) =>
      current.includes(handle)
        ? current.filter((item) => item !== handle)
        : [...current, handle]
    )
  }

  return (
    <nav
      aria-label="Category navigation"
      data-testid="category-tree"
      className={cn("mb-4", className)}
    >
      <div className="mb-2 flex items-center gap-1">
        <LocalizedClientLink
          href="/categories"
          className={cn(
            ROOT_LINK_CLASSES,
            !activeHandle && "font-semibold text-[rgb(var(--brand-600))]"
          )}
        >
          All Products
        </LocalizedClientLink>
      </div>
      <ul className="space-y-0.5">
        {tree.map((node) => (
          <CategoryTreeNodeView
            key={node.id}
            node={node}
            depth={1}
            activeHandle={activeHandle ?? null}
            openHandles={openHandles}
            onToggle={toggle}
          />
        ))}
      </ul>
    </nav>
  )
}

function CategoryTreeNodeView({
  node,
  depth,
  activeHandle,
  openHandles,
  onToggle,
}: {
  node: CategoryTreeNode
  depth: number
  activeHandle: string | null
  openHandles: string[]
  onToggle: (handle: string) => void
}) {
  const isActive = node.handle === activeHandle
  const isOpen = openHandles.includes(node.handle)
  const children = node.category_children ?? []
  const hasChildren = children.length > 0

  return (
    <li>
      <div className="flex items-center gap-0.5">
        {hasChildren ? (
          <button
            type="button"
            aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={isOpen}
            data-testid={`category-tree-toggle-${node.handle}`}
            onClick={() => onToggle(node.handle)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs text-primary transition-colors hover:bg-gray-100"
          >
            <ArrowDownIcon
              size={14}
              className={cn(
                "transition-transform duration-200",
                isOpen ? "rotate-0" : "-rotate-90"
              )}
            />
          </button>
        ) : (
          <span aria-hidden className="h-6 w-6 shrink-0" />
        )}
        <LocalizedClientLink
          href={`/categories/${node.handle}`}
          data-testid={`category-tree-link-${node.handle}`}
          className={cn(
            "flex-1 truncate rounded-xs px-1 py-1.5 text-sm transition-colors",
            isActive
              ? "bg-[rgb(var(--brand-100))] font-semibold text-[rgb(var(--brand-600))]"
              : "text-primary hover:text-[rgb(var(--brand-600))]"
          )}
        >
          {node.name}
        </LocalizedClientLink>
      </div>
      {hasChildren && isOpen ? (
        <ul
          className="space-y-0.5 border-l border-gray-200 pl-1"
          style={{ marginLeft: `${depth * 0.75}rem` }}
        >
          {children.map((child) => (
            <CategoryTreeNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              activeHandle={activeHandle}
              openHandles={openHandles}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
