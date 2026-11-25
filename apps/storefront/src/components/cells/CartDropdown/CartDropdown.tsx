"use client"

import { Badge, Button } from "@/components/atoms"
import { CartDropdownItem, Dropdown } from "@/components/molecules"
import { usePrevious } from "@/hooks/usePrevious"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { CartIcon, CollapseIcon } from "@/icons"
import { convertToLocale } from "@/lib/helpers/money"
import { filterValidCartItems } from "@/lib/helpers/filter-valid-cart-items"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useCartContext } from "@/components/providers"

const getItemCount = (cart: HttpTypes.StoreCart | null) => {
  return cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
}

export const CartDropdown = ({
  iconColor,
  label,
}: {
  iconColor?: string
  label?: string
}) => {
  const { cart } = useCartContext()
  const [open, setOpen] = useState(false)

  const previousItemCount = usePrevious(getItemCount(cart))
  const cartItemsCount = (cart && getItemCount(cart)) || 0
  const pathname = usePathname()

  const validItems = filterValidCartItems(cart?.items)

  const total = convertToLocale({
    amount: cart?.total || 0,
    currency_code: cart?.currency_code || "bdt",
  })

  const delivery = convertToLocale({
    amount: cart?.shipping_subtotal || 0,
    currency_code: cart?.currency_code || "bdt",
  })

  const tax = convertToLocale({
    amount: cart?.tax_total || 0,
    currency_code: cart?.currency_code || "bdt",
  })

  const items = convertToLocale({
    amount: cart?.item_subtotal || 0,
    currency_code: cart?.currency_code || "bdt",
  })

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        setOpen(false)
      }, 2000)

      return () => clearTimeout(timeout)
    }
  }, [open])

  useEffect(() => {
    if (
      previousItemCount !== undefined &&
      cartItemsCount > previousItemCount &&
      pathname.split("/")[2] !== "cart"
    ) {
      setOpen(true)
    }
  }, [cartItemsCount, previousItemCount])

  return (
    <div
      className="relative"
      onPointerOver={(event) => {
        if (
          event.pointerType === "mouse" &&
          !(event.target as HTMLElement).closest("[data-dropdown-toggle]")
        ) {
          setOpen(true)
        }
      }}
      onPointerLeave={() => setOpen(false)}
      onFocus={(event) => {
        if (!(event.target as HTMLElement).closest("[data-dropdown-toggle]")) {
          setOpen(true)
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false)
        }
      }}
    >
      <div className="flex items-center gap-1">
        <LocalizedClientLink
          href="/cart"
          className="flex flex-col items-center gap-1"
          aria-label="Go to cart"
        >
          <span className="relative">
            <CartIcon size={20} color={iconColor} />
            {Boolean(cartItemsCount) && (
              <Badge className="absolute -top-2 -right-2 w-4 h-4 p-0">
                {cartItemsCount}
              </Badge>
            )}
          </span>
          {label && (
            <span className="hidden text-[11px] font-medium lg:block">
              {label}
            </span>
          )}
        </LocalizedClientLink>
        <button
          type="button"
          className="flex h-6 w-5 items-center justify-center sm:hidden"
          aria-label={open ? "Close cart menu" : "Open cart menu"}
          aria-expanded={open}
          data-dropdown-toggle=""
          data-testid="cart-dropdown-toggle"
          onClick={(event) => {
            event.preventDefault()
            setOpen((value) => !value)
          }}
        >
          <CollapseIcon
            size={16}
            color={iconColor ?? "currentColor"}
            className={open ? "rotate-180" : ""}
          />
        </button>
      </div>
      <Dropdown show={open}>
        <div className="lg:w-[460px] shadow-lg">
          <h3 className="uppercase heading-md border-b p-4">Shopping cart</h3>
          <div className="p-4">
            {Boolean(cartItemsCount) ? (
              <div>
                <div className="overflow-y-scroll max-h-[360px] no-scrollbar">
                  {validItems.map((item, index) => (
                    <CartDropdownItem
                      key={item.id ?? index}
                      item={item}
                      currency_code={cart?.currency_code || "bdt"}
                    />
                  ))}
                </div>
                <div className="pt-4">
                  <div className="text-secondary flex justify-between items-center">
                    Items <p className="label-md text-primary">{items}</p>
                  </div>
                  <div className="text-secondary flex justify-between items-center">
                    Delivery <p className="label-md text-primary">{delivery}</p>
                  </div>
                  <div className="text-secondary flex justify-between items-center">
                    Tax <p className="label-md text-primary">{tax}</p>
                  </div>
                  <div className="text-secondary flex justify-between items-center">
                    Total <p className="label-xl text-primary">{total}</p>
                  </div>
                  <LocalizedClientLink href="/cart">
                    <Button className="w-full mt-4 py-3">Go to cart</Button>
                  </LocalizedClientLink>
                </div>
              </div>
            ) : (
              <div className="px-2 sm:px-8">
                <h4 className="heading-md uppercase text-center">
                  Your shopping cart is empty
                </h4>
                <p className="text-lg text-center py-4">
                  Are you looging for inspiration?
                </p>
                <LocalizedClientLink href="/categories">
                  <Button className="w-full py-3">Explore Home Page</Button>
                </LocalizedClientLink>
              </div>
            )}
          </div>
        </div>
      </Dropdown>
    </div>
  )
}
