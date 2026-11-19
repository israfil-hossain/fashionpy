import type { ChatMessage, ChatToolCall } from "./types"

/**
 * Coerce a tool call's `function.arguments` into a JSON string, as the
 * OpenAI wire format requires. Non-standard OpenAI-compatible upstreams
 * (seen with Ant Digital models served through OpenRouter) return
 * `function.arguments` as a parsed object — replaying that verbatim makes
 * the upstream reject the next request with 400 "Assistant tool call
 * function.arguments must be valid JSON".
 */
function normalizeArguments(args: unknown): string {
  if (typeof args === "string") {
    try {
      JSON.parse(args)
      return args
    } catch {
      // Unrepairable — dispatchTool tolerates `{}`; a valid JSON string is
      // what unblocks the request.
      return "{}"
    }
  }
  if (args === null || args === undefined) {
    return "{}"
  }
  try {
    return JSON.stringify(args)
  } catch {
    return "{}"
  }
}

export function normalizeToolCalls(calls: ChatToolCall[]): ChatToolCall[] {
  return calls.map((call, index) => ({
    id: call.id || `call_${index}`,
    type: "function",
    function: {
      name: call.function?.name ?? "",
      arguments: normalizeArguments(call.function?.arguments),
    },
  }))
}

/** Normalizes assistant `tool_calls` on every outgoing message. */
export function normalizeOutgoingMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) =>
    message.role === "assistant" && message.tool_calls?.length
      ? { ...message, tool_calls: normalizeToolCalls(message.tool_calls) }
      : message
  )
}
