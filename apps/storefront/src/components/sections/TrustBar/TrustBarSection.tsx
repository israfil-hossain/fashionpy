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
      <div className="px-4 py-3 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:gap-x-16">
        {trustItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <Image
              src={item.src}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />
            <span className="text-sm font-medium text-gray-700">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
