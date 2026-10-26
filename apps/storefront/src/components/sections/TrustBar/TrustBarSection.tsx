import Image from "next/image"

const trustItems = [
  { src: "/images/trust/cash-on-delivery.png", label: "Cash on Delivery" },
  { src: "/images/trust/instant-return.png", label: "Instant Return" },
  { src: "/images/trust/delivery-48h.png", label: "Delivery Within 48hrs" },
  { src: "/images/trust/best-price.png", label: "Best Price Deal" },
]

export function TrustBarSection() {
  return (
    <div
      className="rounded-xl bg-white shadow-sm"
      data-testid="trust-bar"
    >
      <div className="px-3 py-4 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-x-10 md:gap-y-4 md:px-4 md:py-3 lg:gap-x-16">
        <div className="grid grid-cols-4 gap-2 md:contents">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-3 md:text-left"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FFF0F6] md:h-11 md:w-11 md:bg-transparent">
                <Image
                  src={item.src}
                  alt=""
                  width={44}
                  height={44}
                  className="h-8 w-8 object-contain md:h-11 md:w-11"
                />
              </div>
              <span className="text-[11px] font-medium leading-tight text-gray-700 md:text-sm">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
