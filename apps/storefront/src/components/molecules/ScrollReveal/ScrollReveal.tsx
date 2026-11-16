"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

/**
 * Reveal-on-scroll wrapper. SSR output stays fully visible (crawlers and
 * no-JS readers are unaffected); once hydration runs the document is marked
 * `data-reveal-ready`, which arms the hidden state, and the observer releases
 * each element as it enters the viewport. Only use below the fold to avoid a
 * visible arm/hide flash on first paint.
 */
export const ScrollReveal = ({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    document.documentElement.setAttribute("data-reveal-ready", "1")

    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`studio-reveal ${className ?? ""}`}
      data-revealed={revealed ? "true" : undefined}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  )
}
