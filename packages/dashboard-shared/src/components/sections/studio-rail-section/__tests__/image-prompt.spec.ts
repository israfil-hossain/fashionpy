import { describe, expect, test } from "vitest"

import {
  STUDIO_RAIL_IMAGE_PROMPT,
  STUDIO_RAIL_PROMPT_STEPS,
} from "../image-prompt"

describe("STUDIO_RAIL_IMAGE_PROMPT", () => {
  test("asks for the three views used by the rail", () => {
    expect(STUDIO_RAIL_IMAGE_PROMPT).toContain("Hanging view")
    expect(STUDIO_RAIL_IMAGE_PROMPT).toContain("Front view")
    expect(STUDIO_RAIL_IMAGE_PROMPT).toContain("Back view")
  })

  test("states the transparent or white background rule", () => {
    expect(STUDIO_RAIL_IMAGE_PROMPT).toContain("Transparent background")
    expect(STUDIO_RAIL_IMAGE_PROMPT).toContain("#FFFFFF")
  })

  test("requests square, consistently framed images", () => {
    expect(STUDIO_RAIL_IMAGE_PROMPT).toContain("1:1")
    expect(STUDIO_RAIL_IMAGE_PROMPT).toContain("80%")
    expect(STUDIO_RAIL_IMAGE_PROMPT).toContain("top 5%")
  })
})

describe("STUDIO_RAIL_PROMPT_STEPS", () => {
  test("covers generation through storefront verification", () => {
    expect(STUDIO_RAIL_PROMPT_STEPS.map(step => step.title)).toEqual([
      "Generate",
      "Download",
      "Upload",
      "Assign",
      "Check",
    ])
    for (const step of STUDIO_RAIL_PROMPT_STEPS) {
      expect(step.body.length).toBeGreaterThan(10)
    }
  })
})
