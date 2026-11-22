export type SearchCandidate = {
  title?: string | null
  handle?: string | null
  description?: string | null
  categories?: Array<{ name?: string | null; handle?: string | null }> | null
  type?: { value?: string | null } | null
  tags?: Array<{ value?: string | null }> | null
}

const STOP_WORDS = new Set([
  "a", "about", "am", "an", "and", "any", "are", "at", "be", "but", "by",
  "can", "could", "do", "does", "for", "from", "get", "give", "have", "hello",
  "here", "hey", "hi", "i", "in", "is", "it", "like", "looking", "me", "my",
  "need", "of", "on", "ok", "okay",
  "or", "our", "please", "product", "products", "should", "show", "some",
  "tell", "that", "the", "their", "there", "this", "to", "want", "what",
  "which", "who", "with", "would", "you", "your",
])

const SYNONYM_GROUPS: string[][] = [
  [
    "shoe", "shoes", "sneaker", "sneakers", "sandal", "sandals", "boot",
    "boots", "footwear", "slipper", "slippers", "cleat", "cleats", "pump",
    "pumps", "trainer", "trainers", "loafer", "loafers", "runner", "runners",
    "জুতা", "জুতো", "স্নিকার", "স্যান্ডেল", "বুট",
  ],
  ["shirt", "shirts", "tshirt", "tshirts", "tee", "tees", "top", "tops"],
  ["pant", "pants", "trouser", "trousers", "jeans"],
  ["bag", "bags", "backpack", "backpacks", "handbag", "handbags", "purse"],
  ["watch", "watches"],
]

const BENGALI_STOP_WORDS = new Set([
  "আমি", "আমার", "আমাদের", "চাই", "চাচ্ছি", "দেখাও", "দেখা", "কিছু",
  "একটা", "অনুগ্রহ", "করুন", "জন্য", "কি", "কোথায়", "খুঁজছি",
])

const upper = (value: unknown): string =>
  typeof value === "string" ? value.toLowerCase() : ""

export function normalizeSearchTerms(query: string): string[] {
  return [
    ...new Set(
      upper(query)
        .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, " ")
        .split(/[\s-]+/)
        .filter(Boolean)
        .filter((term) => !STOP_WORDS.has(term) && !BENGALI_STOP_WORDS.has(term))
    ),
  ]
}

export function getSearchTerms(query: string): string[] {
  const terms = new Set<string>()
  for (const token of normalizeSearchTerms(query)) {
    terms.add(token)
    const singular = token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token
    if (singular !== token) {
      terms.add(singular)
    }
    if (token.length > 4 && token.endsWith("ies")) {
      terms.add(`${token.slice(0, -3)}y`)
    }
    for (const group of SYNONYM_GROUPS) {
      if (group.includes(token) || group.includes(singular)) {
        for (const member of group) {
          terms.add(member)
        }
      }
    }
  }
  return [...terms]
}

function contains(haystack: string, needle: string): boolean {
  return !!haystack && !!needle && haystack.includes(needle)
}

export function rankSearchResults<T extends SearchCandidate>(
  candidates: T[],
  query: string,
  limit: number
): T[] {
  const tokens = normalizeSearchTerms(query)
  if (tokens.length === 0) {
    return []
  }

  const groups = tokens.map((token) => new Set(getSearchTerms(token)))
  const hits: Array<{ item: T; score: number; strong: boolean; index: number }> = []

  candidates.forEach((item, index) => {
    const title = upper(item.title)
    const handle = upper(item.handle)
    const description = upper(item.description)
    const categories = (item.categories ?? []).flatMap((category) => [
      upper(category?.name),
      upper(category?.handle),
    ])
    const type = upper(item.type?.value)
    const tags = (item.tags ?? []).map((tag) => upper(tag?.value))

    let score = 0
    let strong = false

    for (const group of groups) {
      const terms = [...group]
      const inTitle = terms.some((term) => contains(title, term))
      const inHandle = terms.some((term) => contains(handle, term))
      const inCategory = terms.some((term) =>
        categories.some((category) => contains(category, term))
      )
      const inType = terms.some((term) => contains(type, term))
      const inTags = terms.some((term) => tags.some((tag) => contains(tag, term)))
      const inDescription = terms.some((term) => contains(description, term))

      if (inTitle) {
        score += 40
        strong = true
      }
      if (inHandle) {
        score += 25
        strong = true
      }
      if (inCategory) {
        score += 30
        strong = true
      }
      if (inType) {
        score += 25
        strong = true
      }
      if (inTags) {
        score += 20
        strong = true
      }
      if (inDescription) {
        score += 5
      }
    }

    if (score > 0) {
      hits.push({ item, score, strong, index })
    }
  })

  const hasStrongMatches = hits.some((hit) => hit.strong)
  return hits
    .filter((hit) => !hasStrongMatches || hit.strong)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map((hit) => hit.item)
}
