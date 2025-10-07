import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"

export function CategoryCard({
  category,
}: {
  category: { id: number; name: string; handle: string }
}) {
  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      className="group relative flex flex-col items-center border rounded-sm bg-component transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-action w-[233px] aspect-square overflow-hidden"
    >
      <div className="flex relative aspect-square overflow-hidden w-[200px]">
        <Image
          loading="lazy"
          src={`/images/categories/${category.handle}.png`}
          alt={`category - ${category.name}`}
          width={200}
          height={200}
          sizes="(min-width: 1024px) 200px, 40vw"
          className="object-contain scale-90 rounded-full transition-transform duration-300 group-hover:scale-100"
        />
      </div>
      <h3 className="w-full text-center label-lg text-primary font-semibold uppercase tracking-wide transition-colors duration-300 group-hover:text-action">
        {category.name}
      </h3>
    </LocalizedClientLink>
  )
}
