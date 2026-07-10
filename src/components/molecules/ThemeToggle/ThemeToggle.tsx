"use client"

import { useTheme } from "@/providers/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const icon = resolvedTheme === "dark" ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 13.5C11.4853 13.5 13.5 11.4853 13.5 9C13.5 6.51472 11.4853 4.5 9 4.5C6.51472 4.5 4.5 6.51472 4.5 9C4.5 11.4853 6.51472 13.5 9 13.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 1.5V3M9 15V16.5M1.5 9H3M15 9H16.5M3.825 3.825L4.875 4.875M13.125 13.125L14.175 14.175M14.175 3.825L13.125 4.875M4.875 13.125L3.825 14.175" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.75 10.5C15.75 13.2614 13.2614 15.75 10.5 15.75C7.73858 15.75 5.25 13.2614 5.25 10.5C5.25 7.73858 7.73858 5.25 10.5 5.25C13.2614 5.25 15.75 7.73858 15.75 10.5Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 1.5V3M10.5 15V16.5M1.5 10.5H3M15 10.5H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )

  return (
    <button
      onClick={cycleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      aria-label={`Switch to ${theme === "light" ? "dark" : theme === "dark" ? "system" : "light"} mode`}
      title={`Theme: ${theme}`}
    >
      {icon}
    </button>
  )
}
