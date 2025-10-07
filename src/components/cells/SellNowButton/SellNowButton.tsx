import { Button } from "@/components/atoms"
import { ArrowRightIcon } from "@/icons"
import Link from "next/link"

export const SellNowButton = () => {
  return (
    <Link
      href={
        process.env.NEXT_PUBLIC_ALGOLIA_ID === "UO3C5Y8NHX"
          ? "https://vendor-sandbox.vercel.app/"
          : "https://vendor.mercurjs.com"
      }
    >
      <Button className="group uppercase !font-bold px-8 py-4 gap-2 flex items-center bg-white !text-brand-600 hover:bg-brand-50 transition-all duration-300 shadow-lg">
        Sell now
        <ArrowRightIcon
          color="rgb(147, 1, 86)"
          className="w-5 h-5 group-hover:translate-x-1 transition-all duration-300"
        />
      </Button>
    </Link>
  )
}
