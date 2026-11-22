import {
  getSearchTerms,
  normalizeSearchTerms,
  rankSearchResults,
  type SearchCandidate,
} from "../tools/search-relevance"

type Candidate = SearchCandidate & { id: string; title: string }

const candidate = (
  id: string,
  title: string,
  extra: Partial<SearchCandidate> = {}
): Candidate => ({ id, title, ...extra })

describe("chatbot search relevance", () => {
  describe("normalizeSearchTerms", () => {
    it("drops filler words and punctuation from natural-language queries", () => {
      expect(
        normalizeSearchTerms("Hi, I want to show me some shoes for men!")
      ).toEqual(["shoes", "men"])
    })

    it("keeps Bangla terms intact", () => {
      expect(normalizeSearchTerms("আমি জুতা চাই")).toEqual(["জুতা"])
    })

    it("returns no terms for an empty or filler-only query", () => {
      expect(normalizeSearchTerms("   ")).toEqual([])
      expect(normalizeSearchTerms("show me the")).toEqual([])
    })
  })

  describe("getSearchTerms", () => {
    it("expands a footwear query to the catalog's own category and model names", () => {
      const terms = getSearchTerms("shoes")
      expect(terms).toEqual(
        expect.arrayContaining([
          "shoe",
          "shoes",
          "sneaker",
          "sandal",
          "boot",
          "footwear",
          "runner",
          "জুতা",
        ])
      )
    })
  })

  describe("rankSearchResults", () => {
    const candidates: Candidate[] = [
      candidate("cat_1", "Comet Star Icon", {
        categories: [{ name: "Sneakers", handle: "sneakers" }],
      }),
      candidate("cat_2", "Vantage Runner", {
        categories: [{ name: "Sport", handle: "sport" }],
      }),
      candidate("care_1", "Leather Care Kit", {
        description: "Designed to fit most shoe sizes and styles",
      }),
      candidate("tee_1", "Cotton Tee", {
        categories: [{ name: "T-Shirts", handle: "t-shirts" }],
      }),
    ]

    it("returns only genuinely relevant products for 'shoes'", () => {
      const result = rankSearchResults(candidates, "shoes", 8)
      expect(result.map((p) => p.id).sort()).toEqual(["cat_1", "cat_2"])
    })

    it("treats a natural-language query like its keyword equivalent", () => {
      expect(
        rankSearchResults(candidates, "I want shoes please", 8).map((p) => p.id).sort()
      ).toEqual(rankSearchResults(candidates, "shoes", 8).map((p) => p.id).sort())
    })

    it("prefers a direct title match over a category-only match", () => {
      const ranked = rankSearchResults(
        [
          candidate("category_only", "Comet Star Icon", {
            categories: [{ name: "Sneakers" }],
          }),
          candidate("title_match", "Sneaker Classic"),
        ],
        "sneaker",
        8
      )
      expect(ranked[0].id).toEqual("title_match")
    })

    it("falls back to description matches when nothing matches strongly", () => {
      expect(rankSearchResults(candidates, "sizes", 8).map((p) => p.id)).toEqual(
        expect.arrayContaining(["care_1"])
      )
    })

    it("respects the limit and returns nothing for a filler-only query", () => {
      expect(rankSearchResults(candidates, "shoes", 1)).toHaveLength(1)
      expect(rankSearchResults(candidates, "show me", 8)).toEqual([])
    })

    it("matches Bangla queries against catalog fields", () => {
      const result = rankSearchResults(
        [candidate("bn_1", "জুতা", { categories: [{ name: "Sneakers" }] })],
        "জুতা",
        8
      )
      expect(result.map((p) => p.id)).toEqual(["bn_1"])
    })
  })
})
