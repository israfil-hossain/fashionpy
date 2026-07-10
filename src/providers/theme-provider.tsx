"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type Theme = "light" | "dark" | "system"
type ThemeValue = "light" | "dark"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ThemeValue
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_KEY = "fashionpy_theme"

function getSystemTheme(): ThemeValue {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system"
  const stored = localStorage.getItem(THEME_KEY) as Theme
  return stored || "system"
}

function resolveTheme(theme: Theme): ThemeValue {
  if (theme === "system") return getSystemTheme()
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ThemeValue>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)

    const html = document.documentElement
    html.classList.remove("light", "dark")
    html.classList.add(resolved)
    html.style.colorScheme = resolved

    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        const resolved = getSystemTheme()
        setResolvedTheme(resolved)
        const html = document.documentElement
        html.classList.remove("light", "dark")
        html.classList.add(resolved)
        html.style.colorScheme = resolved
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
