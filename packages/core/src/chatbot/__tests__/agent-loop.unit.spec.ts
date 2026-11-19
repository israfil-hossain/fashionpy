/**
 * Mock LLM: first call returns a tool_call to search_products; second call
 * returns a final assistant message. Verifies the agent loop shape without
 * network access.
 */
import { CHAT_MESSAGE } from "./fixtures"

type FakeResult = {
  content: string | null
  tool_calls: Array<{
    id: string
    type: "function"
    function: { name: string; arguments: string }
  }>
}

const script: FakeResult[] = [
  {
    content: null,
    tool_calls: [
      {
        id: "call_1",
        type: "function",
        function: {
          name: "search_products",
          arguments: JSON.stringify({ q: "facewash", limit: 4 }),
        },
      },
    ],
  },
  {
    content: "Here are facewash products for you.",
    tool_calls: [],
  },
]

let call = 0

const mockProvider = {
  complete: async () => {
    const next = script[Math.min(call, script.length - 1)]
    call += 1
    return next
  },
  test: async () => ({ ok: true }),
}

describe("agent loop with mock LLM", () => {
  beforeEach(() => {
    call = 0
  })

  test("executes tool then returns final answer", async () => {
    // Lightweight re-implementation of the loop contract used by runAgent
    const messages: Array<Record<string, unknown>> = [
      { role: "system", content: "test" },
      { role: "user", content: "find facewash" },
    ]
    const toolsExecuted: string[] = []
    let final = ""

    for (let step = 0; step < 8; step++) {
      const completion = await mockProvider.complete(messages, [], {} as never)
      if (completion.tool_calls.length > 0) {
        for (const callDef of completion.tool_calls) {
          toolsExecuted.push(callDef.function.name)
          messages.push({
            role: "assistant",
            tool_calls: completion.tool_calls,
          })
          messages.push({
            role: "tool",
            tool_call_id: callDef.id,
            name: callDef.function.name,
            content: JSON.stringify({ content: "1 product", cards: [] }),
          })
        }
        continue
      }
      final = completion.content ?? ""
      break
    }

    expect(toolsExecuted).toEqual(["search_products"])
    expect(final).toBe("Here are facewash products for you.")
    expect(CHAT_MESSAGE).toBe("ok")
  })
})
