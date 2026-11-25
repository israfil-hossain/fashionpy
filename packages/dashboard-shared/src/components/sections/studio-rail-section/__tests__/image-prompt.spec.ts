import { describe, expect, test } from "vitest"

import {
  STUDIO_RAIL_IMAGE_PROMPTS,
  STUDIO_RAIL_PROMPT_STEPS,
} from "../image-prompt"

describe("STUDIO_RAIL_IMAGE_PROMPTS", () => {
  test("provides one separate prompt for each view", () => {
    expect(STUDIO_RAIL_IMAGE_PROMPTS.map(item => item.key)).toEqual([
      "side",
      "front",
      "back",
    ])
    expect(STUDIO_RAIL_IMAGE_PROMPTS.map(item => item.title)).toEqual([
      "85-degree side image",
      "Front image",
      "Back image",
    ])
  })

  test("each prompt asks for exactly one transparent PNG", () => {
    for (const item of STUDIO_RAIL_IMAGE_PROMPTS) {
      expect(item.prompt).toContain("exactly one image")
      expect(item.prompt).toContain("alpha = 0")
      expect(item.prompt).not.toContain("checkerboard")
      expect(item.prompt).not.toContain("white")
      expect(item.prompt).not.toContain("#FFFFFF")
    }
  })

  test("side prompt uses 85 degrees", () => {
    expect(STUDIO_RAIL_IMAGE_PROMPTS[0].prompt).toContain("85 degrees")
  })

  test("all prompts require a straight metal rod and wooden hanger", () => {
    for (const item of STUDIO_RAIL_IMAGE_PROMPTS) {
      expect(item.prompt).toContain("wooden hanger")
      expect(item.prompt).toContain("perfectly vertically")
      expect(item.prompt).toContain("no curved hook")
    }
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
    expect(STUDIO_RAIL_PROMPT_STEPS[0].body).toContain("separate transparent PNG files")
  })
})
