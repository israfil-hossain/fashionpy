'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

import { useLocale } from '@/components/providers/Locale/LocaleProvider'

import {
  addWishlistItem,
  getWishlistState,
  removeWishlistItem,
} from '@/lib/data/wishlist'
import { isWishlistedProduct } from '@/lib/helpers/wishlist'

type WishlistContextValue = {
  customerId: string | null
  productIds: string[]
  loaded: boolean
  isWishlisted: (productId: string) => boolean
  setWishlisted: (productId: string, wishlisted: boolean) => void
  toggle: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export const useWishlistContext = () => useContext(WishlistContext)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const locale = useLocale()
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [productIds, setProductIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    getWishlistState()
      .then(state => {
        if (cancelled) return
        setCustomerId(state.customerId)
        setProductIds(state.productIds)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const setWishlisted = useCallback((productId: string, wishlisted: boolean) => {
    setProductIds(ids =>
      wishlisted
        ? ids.includes(productId)
          ? ids
          : [...ids, productId]
        : ids.filter(id => id !== productId)
    )
  }, [])

  const toggle = useCallback(
    async (productId: string) => {
      if (!loaded) return
      if (!customerId) {
        router.push(`/${locale}/login`)
        return
      }

      const wasWishlisted = isWishlistedProduct(productIds, productId)
      setWishlisted(productId, !wasWishlisted)

      try {
        if (wasWishlisted) {
          await removeWishlistItem({ reference_id: productId })
        } else {
          await addWishlistItem({
            reference_id: productId,
            reference: 'product',
          })
        }
        router.refresh()
      } catch (error) {
        setWishlisted(productId, wasWishlisted)
        console.error(error)
      }
    },
    [customerId, loaded, locale, productIds, router, setWishlisted]
  )

  const value = useMemo(
    () => ({
      customerId,
      productIds,
      loaded,
      isWishlisted: (productId: string) =>
        isWishlistedProduct(productIds, productId),
      setWishlisted,
      toggle,
    }),
    [customerId, loaded, productIds, setWishlisted, toggle]
  )

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}
