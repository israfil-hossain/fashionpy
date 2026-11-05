export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  category: { id: string; name: string; slug: string } | null
  tags: string[]
  author: string | null
  published_at: string | null
  href: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
}
