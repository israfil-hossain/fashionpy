"use client"

import type { ReactNode } from "react"

/**
 * In-page jump link that always notifies ProductTabs, even when the hash is
 * already set (a plain anchor fires no hashchange on a repeat click).
 */
export const ProductJumpLink = ({
  hash,
  children,
  className,
  testId,
}: {
  hash: string
  children: ReactNode
  className?: string
  testId?: string
}) => (
  <a
    href={`#${hash}`}
    className={className}
    data-testid={testId}
    onClick={event => {
      event.preventDefault()
      window.history.pushState(null, "", `#${hash}`)
      window.dispatchEvent(new Event("hashchange"))
    }}
  >
    {children}
  </a>
)
