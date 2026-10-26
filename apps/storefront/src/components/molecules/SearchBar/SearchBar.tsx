"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import clsx from "clsx"

import { SearchIcon } from "@/icons"

interface SearchBarProps {
  className?: string
  size?: "compact" | "large"
}

export const SearchBar = ({ className, size = "large" }: SearchBarProps) => {
  const router = useRouter()
  const [value, setValue] = useState("")

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    router.push(
      value ? `/categories?query=${encodeURIComponent(value)}` : "/categories"
    )
  }

  const compact = size === "compact"

  return (
    <form
      role="search"
      onSubmit={submitHandler}
      className={clsx("relative flex w-full items-center", className)}
      data-testid="search-bar"
    >
      <SearchIcon
        size={18}
        color="#9ca3af"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
      />
      <label className="sr-only" htmlFor={`search-input-${size}`}>
        Search products
      </label>
      <input
        id={`search-input-${size}`}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products..."
        className={clsx(
          "w-full rounded-full bg-white text-sm !font-medium text-gray-700 outline-none",
          "placeholder:text-gray-400",
          compact ? "h-10 pl-10 pr-24" : "h-11 pl-10 pr-20 md:h-12 md:pl-11 md:pr-24",
          "border border-transparent shadow-sm focus:border-[rgb(var(--brand-300))]"
        )}
        data-testid="search-bar-input"
      />
      <button
        type="submit"
        className={clsx(
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--brand-500))] font-semibold text-white transition-colors hover:bg-[rgb(var(--brand-600))]",
          compact
            ? "right-1 h-8 px-5 text-sm"
            : "right-1 h-8 px-4 text-xs md:right-1.5 md:h-9 md:px-6 md:text-sm"
        )}
        data-testid="search-bar-button"
      >
        Search
      </button>
    </form>
  )
}
