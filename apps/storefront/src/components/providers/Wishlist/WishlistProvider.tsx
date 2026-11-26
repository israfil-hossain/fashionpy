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

import {
  addWishlistItem,
  getWishlistState,
  removeWishlistItem,
} from '@/lib/data/wishlist'
import { isWishlistedProduct } from '@/lib/helpers/wishlist'

type WishlistContextValue = {
  customerId: string | null
  productIds: string[]
  isWishlisted: (productId: string) => boolean
  toggle: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export const useWishlistContext = () => useContext(WishlistContext)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
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

  const toggle = useCallback(
    async (productId: string) => {
      if (!loaded) return
      if (!customerId) {
        router.push('/login')
        return
      }

      const wasWishlisted = isWishlistedProduct(productIds, productId)
      setProductIds(ids =>
        wasWishlisted ? ids.filter(id => id !== productId) : [...ids, productId]
      )

      try {
        if (wasWishlisted) {
          await removeWishlistItem({ reference_id: productId })
        } else {
          await addWishlistItem({
            reference_id: productId,
            reference: 'product',
          })
        }
      } catch (error) {
        setProductIds(ids =>
          wasWishlisted
            ? [...ids, productId]
            : ids.filter(id => id !== productId)
        )
        console.error(error)
      }
    },
    [customerId, loaded, productIds, router]
  )

  const value = useMemo(
    () => ({
      customerId,
      productIds,
      isWishlisted: (productId: string) =>
        isWishlistedProduct(productIds, productId),
      toggle,
    }),
    [customerId, productIds, toggle]
  )

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}
