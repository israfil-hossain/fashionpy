import Link from "next/link"

import { BlogCard } from "@/components/organisms/BlogCard/BlogCard"
import { listBlogPosts } from "@/lib/data/blog-posts"

export async function BlogSection({ locale }: { locale: string }) {
  const { blog_posts } = await listBlogPosts({
    countryCode: locale,
    limit: 3,
  })

  if (!blog_posts.length) {
    return null
  }

  return (
    <section data-testid="blog-section">
      <div className="flex items-center justify-center mb-8">
        <h2 className="heading-md uppercase text-gray-900">
          STAY UP TO DATE
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {blog_posts.map((post, index) => (
          <BlogCard key={post.id} index={index} post={post} />
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <Link
          href="/blog"
          className="uppercase label-md border border-primary px-6 py-3 hover:bg-primary hover:text-tertiary transition-colors"
          data-testid="blog-show-more"
        >
          Show More
        </Link>
      </div>
    </section>
  )
}
