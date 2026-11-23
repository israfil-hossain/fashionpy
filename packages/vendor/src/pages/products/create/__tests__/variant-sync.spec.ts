import { createFormControl } from "react-hook-form"
import { describe, expect, test } from "vitest"

import { ProductCreateSchemaType } from "../types"
import { applyScrapedDraft, subscribeVariantsToAttributes } from "../utils"

const customAxis = (title: string, values: string[]) => ({
  attribute_id: undefined,
  title,
  values,
  is_custom: true,
  use_for_variants: true,
})

const setup = () => {
  const form = createFormControl<ProductCreateSchemaType>({
    defaultValues: { attributes: [], variants: [] } as unknown as ProductCreateSchemaType,
  })
  const unsubscribe = subscribeVariantsToAttributes(form)
  const titles = () => form.getValues("variants").map((v) => v.title)

  return { form, unsubscribe, titles }
}

describe("subscribeVariantsToAttributes", () => {
  test("seeds a default variant when no axis is set", () => {
    const { titles } = setup()

    expect(titles()).toEqual(["Default variant"])
  })

  test("rebuilds rows for every value added to an axis", () => {
    const { form, titles } = setup()

    form.setValue("attributes", [customAxis("Edition", ["Standard"])])
    expect(titles()).toEqual(["Standard"])

    form.setValue("attributes.0.values", ["Standard", "Deluxe"])
    expect(titles()).toEqual(["Standard", "Deluxe"])
  })

  test("builds the full permutation table for a second axis", () => {
    const { form, titles } = setup()

    form.setValue("attributes", [
      customAxis("Edition", ["Standard", "Deluxe"]),
      customAxis("Platform", ["PC", "Xbox"]),
    ])

    expect(titles()).toEqual([
      "Standard / PC",
      "Standard / Xbox",
      "Deluxe / PC",
      "Deluxe / Xbox",
    ])
    expect(form.getValues("variants").map((v) => v.options)).toEqual([
      { Edition: "Standard", Platform: "PC" },
      { Edition: "Standard", Platform: "Xbox" },
      { Edition: "Deluxe", Platform: "PC" },
      { Edition: "Deluxe", Platform: "Xbox" },
    ])
  })

  test("reacts to the use_for_variants switch on an existing row", () => {
    const { form, titles } = setup()

    form.setValue("attributes", [
      { ...customAxis("Edition", ["Standard", "Deluxe"]), use_for_variants: false },
    ])
    expect(titles()).toEqual(["Default variant"])

    form.setValue("attributes.0.use_for_variants", true)
    expect(titles()).toEqual(["Standard", "Deluxe"])
  })

  test("stops syncing after unsubscribe", () => {
    const { form, unsubscribe, titles } = setup()

    unsubscribe()
    form.setValue("attributes", [customAxis("Edition", ["Standard"])])

    expect(titles()).toEqual(["Default variant"])
  })
  test("applies per-variant SKUs from an AI draft to the generated rows", () => {
    const { form } = setup()

    applyScrapedDraft(form as never, {
      source_url: "https://example.com/p/1",
      images: [],
      category_names: [],
      option_axes: [{ title: "Size", values: ["S", "M"] }],
      variants: [
        { title: "S", options: { Size: "S" }, sku: "TEE-S" },
        { title: "M", options: { Size: "M" }, sku: "TEE-M" },
      ],
      sku: "TEE",
    })

    expect(form.getValues("variants").map((variant) => variant.sku)).toEqual([
      "TEE-S",
      "TEE-M",
    ])
  })

  test("uses the draft-level SKU when there is a single variant", () => {
    const { form } = setup()

    applyScrapedDraft(form as never, {
      source_url: "https://example.com/p/2",
      images: [],
      category_names: [],
      option_axes: [],
      variants: [],
      sku: "SOLO-SKU",
    })

    expect(form.getValues("variants")[0]?.sku).toBe("SOLO-SKU")
  })
})

