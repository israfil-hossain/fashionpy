import { RefObject, useEffect, useRef } from "react"

export function useDismissOnOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  close: () => void
) {
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    if (!active) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        closeRef.current()
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [active, ref])
}
