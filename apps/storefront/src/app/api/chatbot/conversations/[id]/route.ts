import { NextRequest } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/**
 * GET /api/chatbot/conversations/:id — conversation history for the widget
 * (SPEC-011: shows admin follow-ups when the customer reopens the chat).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const headers: Record<string, string> = {
    "x-publishable-api-key": PUBLISHABLE_KEY,
    "Content-Type": "application/json",
  }
  const cookieHeader = _req.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)_medusa_jwt=([^;]+)/)
  if (match?.[1]) {
    headers.Authorization = `Bearer ${decodeURIComponent(match[1])}`
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/store/chatbot/conversations/${encodeURIComponent(id)}`,
      {
        headers,
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      }
    )
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch (err) {
    return Response.json(
      { error: (err as Error).message || "Chat unavailable" },
      { status: 502 }
    )
  }
}
