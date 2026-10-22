"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import clsx from "clsx"

import { SearchBar } from "@/components/molecules/SearchBar/SearchBar"

const SCROLL_REVEAL_THRESHOLD = 120

export const HeaderSearch = ({ className }: { className?: string }) => {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  const segments = pathname.split("/").filter(Boolean)
  const isHome = segments.length <= 1

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_REVEAL_THRESHOLD)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const visible = !isHome || scrolled

  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[560px] transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
        className
      )}
      data-testid="header-search"
    >
      <SearchBar size="compact" />
    </div>
  )
}
