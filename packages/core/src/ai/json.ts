export class AiResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AiResponseError"
  }
}

function fencedBlock(text: string): string | null {
  const match = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  return match ? match[1] : null
}

/**
 * Pull the first JSON object out of a completion. Providers occasionally wrap
 * JSON in prose or markdown fences even when asked for raw JSON.
 */
export function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new AiResponseError("The model returned an empty response")
  }

  const candidate = fencedBlock(trimmed) ?? trimmed
  const start = candidate.indexOf("{")
  const end = candidate.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new AiResponseError("The model did not return a JSON object")
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    throw new AiResponseError("The model returned malformed JSON")
  }
}
