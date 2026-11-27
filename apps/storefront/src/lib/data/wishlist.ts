'use server'
import { HttpTypes } from '@medusajs/types'
import { revalidatePath } from 'next/cache'

import { sdk } from '@/lib/client'
import { getBuyboxWinner, getOfferAmount } from '@/lib/helpers/buybox'
import { Wishlist } from '@/types/wishlist'
import { getAuthHeaders } from './cookies'
import { retrieveCustomer } from './customer'
import { listOffers } from './offers'

export const getUserWishlists = async () => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
  }

  const { products, count } = (await sdk.store.wishlist.query({
    fetchOptions: { headers, cache: 'no-cache' },
  } as never)) as unknown as {
    products: Array<
      HttpTypes.StoreProduct & {
        calculated_price?: {
          calculated_amount?: number | null
          currency_code?: string | null
        } | null
        calculated_amount?: number
        currency_code?: string
      }
    >
    count: number
  }

  const normalized = await Promise.all(
    (products ?? []).map(async product => {
      const amount =
        product.calculated_price?.calculated_amount ??
        product.calculated_amount
      const currency =
        product.calculated_price?.currency_code ?? product.currency_code

      if (typeof amount === 'number' && currency) {
        return { ...product, calculated_amount: amount, currency_code: currency }
      }

      const { offers } = await listOffers({
        productId: product.id,
        countryCode: process.env.NEXT_PUBLIC_DEFAULT_REGION || 'bd',
        limit: 5,
      })
      const winner = getBuyboxWinner(offers)
      const offerAmount = winner ? getOfferAmount(winner) : null

      return {
        ...product,
        calculated_amount: offerAmount ?? 0,
        currency_code:
          winner?.calculated_price?.currency_code ??
          currency ??
          'bdt',
      }
    })
  )

  const wishlists: Wishlist[] = normalized.length
    ? [{ id: 'default', products: normalized }]
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
