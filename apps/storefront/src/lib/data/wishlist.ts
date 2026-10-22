'use server'
import { HttpTypes } from '@medusajs/types'
import { revalidatePath } from 'next/cache'

import { sdk } from '@/lib/client'
import { Wishlist } from '@/types/wishlist'
import { getAuthHeaders } from './cookies'

export const getUserWishlists = async () => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
  }

  const { products, count } = (await sdk.store.wishlist.query({
    fetchOptions: { headers, cache: 'no-cache' },
  } as never)) as unknown as {
    products: (HttpTypes.StoreProduct & {
      calculated_amount: number
      currency_code: string
    })[]
    count: number
  }

  const wishlists: Wishlist[] = products?.length
    ? [{ id: 'default', products }]
    : []

  return { wishlists, count: count ?? 0 }
}

export const addWishlistItem = async ({
  reference_id,
  reference,
}: {
  reference_id: string
  reference: 'product'
}) => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
  }

  await sdk.store.wishlist.mutate({
    reference,
    reference_id,
    fetchOptions: { headers },
  } as never)

  revalidatePath('/wishlist')
  revalidatePath('/user/wishlist')
}

export const removeWishlistItem = async ({
  reference_id,
}: {
  reference_id: string
}) => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
  }

  await sdk.store.wishlist.product.$reference_id.delete({
    $reference_id: reference_id,
    fetchOptions: { headers },
  } as never)

  revalidatePath('/wishlist')
  revalidatePath('/user/wishlist')
}
