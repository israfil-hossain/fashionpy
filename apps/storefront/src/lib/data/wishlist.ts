'use server'
import { HttpTypes } from '@medusajs/types'
import { revalidatePath } from 'next/cache'

import { sdk } from '@/lib/client'
import { Wishlist } from '@/types/wishlist'
import { getAuthHeaders } from './cookies'
import { retrieveCustomer } from './customer'

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

export const getWishlistState = async (): Promise<{
  customerId: string | null
  productIds: string[]
}> => {
  const customer = await retrieveCustomer()
  if (!customer) {
    return { customerId: null, productIds: [] }
  }

  try {
    const { wishlists } = await getUserWishlists()
    return {
      customerId: customer.id,
      productIds: (wishlists[0]?.products ?? []).map(product => product.id)
    }
  } catch {
    return { customerId: customer.id, productIds: [] }
  }
}

export const addWishlistItem = async ({
  reference_id,
  reference,
}: {
  reference_id: string
  reference: 'product'
}): Promise<{ ok: boolean; error?: string }> => {
  try {
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
    return { ok: true }
  } catch (error) {
    console.error('[wishlist] add failed:', error)
    return { ok: false, error: 'Failed to add item to wishlist' }
  }
}

export const removeWishlistItem = async ({
  reference_id,
}: {
  reference_id: string
}): Promise<{ ok: boolean; error?: string }> => {
  try {
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
    return { ok: true }
  } catch (error) {
    console.error('[wishlist] remove failed:', error)
    return { ok: false, error: 'Failed to remove item from wishlist' }
  }
}
