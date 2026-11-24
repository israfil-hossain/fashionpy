"use client"

import { useEffect, useRef, useState } from "react"

const SCROLL_THRESHOLD = 80
const SETTLE_MS = 450

export const HeaderShell = ({ children }: { children: React.ReactNode }) => {
  const [compact, setCompact] = useState(false)
  const lastY = useRef(0)
  const compactRef = useRef(false)
  const lockedUntil = useRef(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      const previous = lastY.current
      lastY.current = y

      // Collapsing the bars moves the content anchor, which fires extra scroll
      // events; ignore them until the header has settled.
      if (performance.now() < lockedUntil.current) {
        return
      }

      let next = compactRef.current
      if (y <= SCROLL_THRESHOLD) {
        next = false
      } else if (y > previous) {
        next = true
      } else if (y < previous) {
        next = false
      }

      if (next !== compactRef.current) {
        compactRef.current = next
        setCompact(next)
        lockedUntil.current = performance.now() + SETTLE_MS
      }
    }

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update)
      }
    }

    lastY.current = window.scrollY
    if (lastY.current > SCROLL_THRESHOLD) {
      compactRef.current = true
      setCompact(true)
    }
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  return (
    <header
      className="sticky top-0 z-50"
      data-compact={compact ? "true" : undefined}
      data-testid="header"
    >
      {children}
    </header>
  )
}
