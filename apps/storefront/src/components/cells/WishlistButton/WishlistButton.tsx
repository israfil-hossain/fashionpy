'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'

import { HttpTypes } from '@medusajs/types'

import { Button } from '@/components/atoms'
import { useWishlistContext } from '@/components/providers'
import { HeartFilledIcon, HeartIcon } from '@/icons'
import { addWishlistItem, removeWishlistItem } from '@/lib/data/wishlist'
import { cn } from '@/lib/utils'
import { Wishlist } from '@/types/wishlist'

export const WishlistButton = ({
  productId,
  wishlist,
  user,
  className,
}: {
  productId: string
  wishlist?: Wishlist[]
  user?: HttpTypes.StoreCustomer | null
  className?: string
}) => {
  const router = useRouter()
  const context = useWishlistContext()
  const [isWishlistAdding, setIsWishlistAdding] = useState(false)
  const [localWishlisted, setLocalWishlisted] = useState<boolean | undefined>(
    undefined
  )

  const usesProps = wishlist !== undefined

  useEffect(() => {
    if (!usesProps) return
    setLocalWishlisted(
      wishlist?.[0]?.products?.some(item => item.id === productId) ?? false
    )
  }, [usesProps, wishlist, productId])

  const isWishlisted =
    localWishlisted ??
    (usesProps ? false : context?.isWishlisted(productId) ?? false)
  const hasUser = Boolean(user?.id || context?.customerId)

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!hasUser) {
      router.push('/login')
      return
    }

    if (!usesProps) {
      await context?.toggle(productId)
      return
    }

    try {
      setIsWishlistAdding(true)
      if (isWishlisted) {
        await removeWishlistItem({ reference_id: productId })
        setLocalWishlisted(false)
      } else {
        await addWishlistItem({
          reference_id: productId,
          reference: 'product',
        })
        setLocalWishlisted(true)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsWishlistAdding(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant="tonal"
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn(
        'w-10 h-10 p-0 flex items-center justify-center',
        className
      )}
      loading={isWishlistAdding}
      disabled={isWishlistAdding}
      data-testid="wishlist-button"
    >
      {isWishlisted ? <HeartFilledIcon size={20} /> : <HeartIcon size={20} />}
    </Button>
  )
}
