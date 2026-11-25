import { describe, expect, test } from "vitest"

import { getStudioRailImageOptions } from "../studio-rail-section"

describe("getStudioRailImageOptions", () => {
  test("lists product images first, then the thumbnail, without duplicates", () => {
    const options = getStudioRailImageOptions({
      id: "prod_1",
      images: [
        { id: "img_1", url: "https://cdn/one.png" },
        { id: "img_2", url: "https://cdn/two.png" },
      ],
      thumbnail: "https://cdn/two.png",
    })

    expect(options).toEqual([
      { url: "https://cdn/one.png", label: "Image 1" },
      { url: "https://cdn/two.png", label: "Thumbnail" },
    ])
  })

  test("handles products with no images", () => {
    expect(getStudioRailImageOptions({ id: "prod_1" })).toEqual([])
  })

  test("ignores blank urls", () => {
    const options = getStudioRailImageOptions({
      id: "prod_1",
      images: [{ id: "img_1", url: "  " }],
    })

    expect(options).toEqual([])
  })
})
