import {
  normalizeOutgoingMessages,
  normalizeToolCalls,
} from "../providers/normalize"
import { OpenAICompatibleProvider } from "../providers"
import type { ChatMessage } from "../providers/types"

describe("tool-call arguments normalization", () => {
  test("stringifies arguments returned as a parsed object", () => {
    const [call] = normalizeToolCalls([
      {
        id: "call_1",
        type: "function",
        // Non-standard upstream: object instead of JSON string.
        function: { name: "search_products", arguments: { q: "facewash" } as never },
      },
    ])

    expect(typeof call.function.arguments).toBe("string")
    expect(JSON.parse(call.function.arguments)).toEqual({ q: "facewash" })
  })

  test("keeps a valid JSON string as-is", () => {
    const args = JSON.stringify({ q: "shoes", limit: 4 })
    const [call] = normalizeToolCalls([
      { id: "c", type: "function", function: { name: "t", arguments: args } },
    ])
    expect(call.function.arguments).toEqual(args)
  })

  test("replaces an unparseable string with {}", () => {
    const [call] = normalizeToolCalls([
      {
        id: "c",
        type: "function",
        function: { name: "t", arguments: "{truncated, not json" },
      },
    ])
    expect(call.function.arguments).toBe("{}")
  })

  test("handles null/undefined arguments and missing ids", () => {
    const calls = normalizeToolCalls([
      {
        id: "",
        type: "function",
        function: { name: "t", arguments: null as never },
      },
      {
        id: "keep",
        type: "function",
        function: { name: "t", arguments: undefined as never },
      },
    ])
    expect(calls[0].function.arguments).toBe("{}")
    expect(calls[0].id).toBeTruthy()
    expect(calls[1].function.arguments).toBe("{}")
    expect(calls[1].id).toBe("keep")
  })

  test("outgoing normalization only touches assistant tool_calls", () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "sys" },
      { role: "user", content: "hi" },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "c1",
            type: "function",
            function: { name: "t", arguments: { a: 1 } as never },
          },
        ],
      },
      { role: "tool", tool_call_id: "c1", content: "{}" },
    ]

    const out = normalizeOutgoingMessages(messages)
    expect(out[0]).toBe(messages[0])
    expect(out[1]).toBe(messages[1])
    expect(out[3]).toBe(messages[3])
    expect(typeof out[2].tool_calls![0].function.arguments).toBe("string")
  })
})

describe("OpenAI-compatible provider wire format", () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  const config = {
    provider: "openrouter" as const,
    api_key: "sk-test",
    model: "test/model",
  }

  test("sends assistant tool_calls with stringified arguments", async () => {
    let sentBody: Record<string, unknown> | null = null
    global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body))
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "ok", tool_calls: [] } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }) as typeof fetch

    const provider = new OpenAICompatibleProvider()
    await provider.complete(
      [
        { role: "user", content: "hi" },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "c1",
              type: "function",
              // What a non-standard upstream returned on the previous turn:
              function: { name: "search_products", arguments: { q: "saree" } as never },
            },
          ],
        },
        { role: "tool", tool_call_id: "c1", content: "{}" },
      ],
      [],
      config
    )

    const sent = sentBody as unknown as {
      messages: ChatMessage[]
    }
    const assistant = sent.messages[1]
    const args = assistant.tool_calls![0].function.arguments
    expect(typeof args).toBe("string")
    expect(JSON.parse(args as unknown as string)).toEqual({ q: "saree" })
  })

  test("normalizes tool_calls received from the provider", async () => {
    global.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  {
                    id: "call_x",
                    type: "function",
                    function: { name: "search_products", arguments: { q: "x" } },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as typeof fetch

    const provider = new OpenAICompatibleProvider()
    const result = await provider.complete([{ role: "user", content: "hi" }], [], config)

    expect(result.tool_calls).toHaveLength(1)
    expect(typeof result.tool_calls[0].function.arguments).toBe("string")
    expect(JSON.parse(result.tool_calls[0].function.arguments)).toEqual({ q: "x" })
  })
})
