import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

export const CartDropdownItem = ({
  item,
  currency_code,
}: {
  item: HttpTypes.StoreCartLineItem
  currency_code: string
}) => {
  const original_total = convertToLocale({
    amount: (item.compare_at_unit_price || 0) * item.quantity,
    currency_code,
  })

  const total = convertToLocale({
    amount: item.subtotal ?? 0,
    currency_code,
  })

  return (
    <div className="border rounded-sm p-1 flex gap-2 mb-4">
      <div className="flex h-[96px] w-[72px] shrink-0 items-center justify-center sm:h-[132px] sm:w-[100px]">
        {item.thumbnail ? (
          <Image
            src={decodeURIComponent(item.thumbnail)}
            alt={item.product_title || ""}
            width={80}
            height={90}
            className="h-[84px] w-[64px] rounded-xs object-cover sm:h-[90px] sm:w-[80px]"
            priority
          />
        ) : (
          <Image
            src={"/images/placeholder.svg"}
            alt="Product thumbnail"
            width={50}
            height={66}
            className="rounded-xs w-[50px] h-[66px] object-contain opacity-30"
          />
        )}
      </div>

      <div className="min-w-0 flex-1 py-2">
        <h4 className="heading-xs break-words">{item.product_title}</h4>
        <div className="label-md text-secondary">
          {Object.entries(item.variant_option_values ?? {}).map(([title, value]) => (
            <p key={title}>
              {title}: <span className="text-primary">{String(value)}</span>
            </p>
          ))}
          <p>
            Quantity: <span className="text-primary">{item.quantity}</span>
          </p>
        </div>
        <div className="pt-2 flex items-center gap-2 mt-4 lg:mt-0">
          <p className="label-lg">{total}</p>
        </div>
      </div>
    </div>
  )
}
