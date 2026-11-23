import {
  BEHAVIOR_RULES,
  DEFAULT_SYSTEM_PROMPT,
  buildSystemMessage,
  collectShownProductTitles,
  replayHistory,
  shownCardLabels,
} from "../prompts"
import type { ChatbotCard } from "../../modules/chatbot/types/common"

const productCard = (
  title: string,
  price: string | null = "BDT 249.60"
): ChatbotCard => ({
  type: "product",
  id: `prod_${title}`,
  title,
  price,
})

const orderCard = (displayId: number): ChatbotCard => ({
  type: "order",
  order_group_id: `og_${displayId}`,
  display_id: displayId,
  status: "pending",
})

describe("chatbot prompts", () => {
  test("behavior rules cover the reported question-quality failures", () => {
    expect(BEHAVIOR_RULES).toMatch(/ONE short, natural question/)
    expect(BEHAVIOR_RULES).toMatch(/Never ask again/)
    expect(BEHAVIOR_RULES).toMatch(/never repeat the same product list/)
    expect(BEHAVIOR_RULES).toMatch(/Do not mix scripts/)
    expect(BEHAVIOR_RULES).toMatch(/ask only for the next missing piece/)
  })

  test("default prompt no longer pushes a search on every product mention", () => {
    expect(DEFAULT_SYSTEM_PROMPT).toMatch(/same language/)
    expect(DEFAULT_SYSTEM_PROMPT).not.toMatch(/When you find products/)
  })

  test("replayHistory drops tool rows and annotates assistant cards", () => {
    const replayed = replayHistory([
      { role: "user", content: "show me boots" },
      {
        role: "assistant",
        content: "Here are boots.",
        cards: [productCard("Harlow Moccasin Boot")],
      },
      { role: "tool", content: `{"cards":[]}` },
      { role: "user", content: "কতটি চান?" },
      { role: "assistant", content: "১টি নাকি বেশি?" },
    ])

    expect(replayed.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ])
    expect(replayed[1].content).toContain("Here are boots.")
    expect(replayed[1].content).toContain(
      "[Shown cards: Harlow Moccasin Boot (BDT 249.60)]"
    )
    expect(replayed[3].content).toBe("১টি নাকি বেশি?")
    expect(replayed[3].content).not.toContain("[Shown cards:")
  })

  test("shownCardLabels renders product and order cards", () => {
    expect(shownCardLabels(null)).toEqual([])
    expect(shownCardLabels([productCard("Cloudpeak Bow Boots", "BDT 162.50")])).toEqual([
      "Cloudpeak Bow Boots (BDT 162.50)",
    ])
    expect(shownCardLabels([productCard("No Price", null)])).toEqual(["No Price"])
    expect(shownCardLabels([orderCard(1042)])).toEqual(["Order #1042"])
  })

  test("collectShownProductTitles dedupes product titles across turns", () => {
    const titles = collectShownProductTitles([
      { role: "assistant", content: "a", cards: [productCard("Harlow Moccasin Boot")] },
      { role: "user", content: "more" },
      {
        role: "assistant",
        content: "b",
        cards: [
          productCard("Harlow Moccasin Boot"),
          productCard("Cloudpeak Chukka II Boot"),
          orderCard(7),
        ],
      },
    ])

    expect(titles).toEqual([
      "Harlow Moccasin Boot",
      "Cloudpeak Chukka II Boot",
    ])
  })

  test("buildSystemMessage composes prompt, rules, context and shown products", () => {
    const message = buildSystemMessage({
      effectivePrompt: "  Custom persona  ",
      locale: "bn",
      phase: "cart",
      customerId: "cus_1",
      shownProductTitles: ["Harlow Moccasin Boot", "Cloudpeak Bow Boots"],
    })

    expect(message).toContain("Custom persona")
    expect(message).toContain(BEHAVIOR_RULES)
    expect(message).toContain(
      "Customer locale: bn. Checkout phase: cart. Customer id: cus_1."
    )
    expect(message).toContain(
      "Products already shown earlier: Harlow Moccasin Boot; Cloudpeak Bow Boots."
    )
  })

  test("buildSystemMessage omits shown-products line when nothing was shown", () => {
    const message = buildSystemMessage({
      effectivePrompt: DEFAULT_SYSTEM_PROMPT,
      locale: "en",
      phase: "idle",
      customerId: null,
      shownProductTitles: [],
    })

    expect(message).toContain('Customer id: guest (not logged in)')
    expect(message).not.toContain("Products already shown earlier")
    // Rules are appended even for the stock prompt.
    expect(message).toContain(BEHAVIOR_RULES)
  })
})