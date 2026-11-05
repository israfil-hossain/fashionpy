import Link from "next/link"
import Image from "next/image"

import { BlogPost } from "@/types/blog"
import { ArrowRightIcon } from "@/icons"
import tailwindConfig from "../../../../tailwind.config"
import { cn } from "@/lib/utils"

interface BlogCardProps {
  post: BlogPost
  index: number
  /** Homepage hides cards 2–3 on mobile; the listing grid shows all. */
  alwaysShow?: boolean
}

export function BlogCard({ post, index, alwaysShow = false }: BlogCardProps) {
  const image = post.image || "/images/blog/post-1.jpg"

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group block border border-secondary p-1 rounded-sm relative",
        !alwaysShow && index > 0 && "hidden lg:block"
      )}
    >
      <div className="relative overflow-hidden rounded-xs h-full">
        <Image
          loading="lazy"
          sizes="(min-width: 1024px) 33vw, 100vw"
          src={decodeURIComponent(image)}
          alt={post.title}
          width={467}
          height={472}
          className="object-cover max-h-[472px] h-full w-full"
        />
      </div>
      <div className="p-4 bg-tertiary text-tertiary absolute bottom-0 left-1 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-b-xs w-[calc(100%-8px)]">
        {post.category && (
          <div className="uppercase label-md mb-2 opacity-80">
            {post.category.name}
          </div>
        )}
        <h3 className="heading-sm">{post.title}</h3>
        <p className="text-md line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center gap-4 uppercase label-md mt-[26px]">
          Read more{" "}
          <ArrowRightIcon
            size={20}
            color={tailwindConfig.theme.extend.colors.tertiary}
          />
        </div>
      </div>
    </Link>
  )
}
