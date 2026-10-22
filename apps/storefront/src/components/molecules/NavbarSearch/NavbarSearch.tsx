"use client"

import { SearchIcon } from "@/icons"
import { useSearchParams, redirect } from "next/navigation"
import { useState } from "react"
import clsx from "clsx"

interface Props {
  className?: string
}

export const NavbarSearch = ({ className }: Props) => {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("query") || "")
  const [open, setOpen] = useState(false)

  const handleSearch = () => {
    if (search) {
      redirect(`/categories?query=${search}`)
    } else {
      redirect(`/categories`)
    }
  }

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSearch()
  }

  const blurHandler = (e: React.FocusEvent<HTMLFormElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false)
    }
  }

  const keyDownHandler = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div
      className={clsx(
        "relative flex items-center justify-end",
        "transition-[width] duration-300 ease-out",
        open ? "w-full" : "w-10",
        className
      )}
      onKeyDown={keyDownHandler}
    >
      <form
        role="search"
        method="POST"
        onSubmit={submitHandler}
        onBlur={blurHandler}
        className={clsx(
          "absolute inset-x-0 flex items-center transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        data-testid="navbar-search"
      >
        <div className="relative w-full">
          <SearchIcon
            size={18}
            color="#9ca3af"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <label className="sr-only" htmlFor="navbar-search-input">
            Search products
          </label>
          <input
            id="navbar-search-input"
            type="search"
            autoFocus={open}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className={clsx(
              "h-10 w-full rounded-full bg-white pl-10 pr-20 text-sm text-gray-700 outline-none",
              "placeholder:text-gray-400",
              "border border-transparent shadow-sm focus:border-[rgb(var(--brand-300))]"
            )}
            data-testid="navbar-search-input"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-full bg-[rgb(var(--brand-500))] px-5 text-sm font-semibold text-white transition-colors hover:bg-[rgb(var(--brand-600))]"
            data-testid="navbar-search-button"
          >
            Search
          </button>
        </div>
      </form>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open search"
        className={clsx(
          "flex h-10 w-10 items-center justify-center rounded-full transition-opacity duration-200 hover:bg-gray-100",
          open ? "pointer-events-none opacity-0" : "opacity-100"
        )}
        data-testid="navbar-search-toggle"
      >
        <SearchIcon size={22} color="#090909" />
      </button>
    </div>
  )
}
