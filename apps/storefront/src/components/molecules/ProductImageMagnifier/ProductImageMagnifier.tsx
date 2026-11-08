"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const LENS_SIZE = 140
const ZOOM = 2.2

/**
 * Desktop-only hover magnifier. Renders the child image normally and, on
 * pointer-fine devices at lg+, overlays a circular lens that shows a zoomed
 * crop of `src` under the cursor. Touch devices never activate.
 */
export const ProductImageMagnifier = ({
  src,
  alt,
  className,
  children,
}: {
  src: string
  alt: string
  className?: string
  children: React.ReactNode
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [lens, setLens] = useState<{ left: number; top: number; bgX: number; bgY: number } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)")
    const update = () => setEnabled(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setLens(null)
      return
    }

    setLens({
      left: x - LENS_SIZE / 2,
      top: y - LENS_SIZE / 2,
      bgX: (x / rect.width) * 100,
      bgY: (y / rect.height) * 100,
    })
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLens(null)}
      data-testid="product-image-magnifier"
    >
      {children}
      {enabled && lens && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 rounded-full border-2 border-white shadow-lg"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: lens.left,
            top: lens.top,
            backgroundImage: `url(${decodeURIComponent(src)})`,
            backgroundSize: `${ZOOM * 100}% ${ZOOM * 100}%`,
            backgroundPosition: `${lens.bgX}% ${lens.bgY}%`,
            backgroundRepeat: "no-repeat",
          }}
          data-testid="product-image-lens"
        />
      )}
    </div>
  )
}
