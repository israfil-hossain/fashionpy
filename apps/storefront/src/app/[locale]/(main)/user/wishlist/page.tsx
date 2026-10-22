import { isEmpty } from 'lodash'

import { Button } from '@/components/atoms'
import { WishlistItem } from '@/components/cells'
import { LoginForm, UserNavigation } from '@/components/molecules'
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink'
import { retrieveCustomer } from '@/lib/data/customer'
import { getUserWishlists } from '@/lib/data/wishlist'
import { Wishlist as WishlistType } from '@/types/wishlist'
import { HttpTypes } from '@medusajs/types'

export default async function WishlistPage() {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  let wishlist: WishlistType[] = []
  try {
    const response = await getUserWishlists()
    wishlist = response.wishlists
  } catch {
    wishlist = []
  }

  const count = wishlist?.[0]?.products?.length || 0

  return (
    <main className="container" data-testid="wishlist-page">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3 space-y-8">
          {isEmpty(wishlist?.[0]?.products) ? (
            <div className="w-96 mx-auto flex flex-col items-center justify-center">
              <h2 className="heading-lg text-primary uppercase mb-2">
                Wishlist
              </h2>
              <p className="text-lg text-secondary mb-6">
                Your wishlist is currently empty.
              </p>
              <LocalizedClientLink href="/categories" className="w-full">
                <Button className="w-full">Explore</Button>
              </LocalizedClientLink>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <h2 className="heading-lg text-primary uppercase">Wishlist</h2>
              <div className="flex justify-between items-center">
                <p>{count} listings</p>
              </div>
              <div className="flex flex-wrap max-md:justify-center gap-4">
                {wishlist?.[0].products?.map((product) => (
                  <WishlistItem
                    key={product.id}
                    product={
                      product as HttpTypes.StoreProduct & {
                        calculated_amount: number
                        currency_code: string
                      }
                    }
                    wishlist={wishlist}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
