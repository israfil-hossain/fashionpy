import { NextRequest } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/** GET /api/chatbot/config — is the assistant enabled? */
export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/store/chatbot/config`, {
      method: "GET",
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({ enabled: false }))
    return Response.json(data, { status: res.status })
  } catch {
    return Response.json({ enabled: false })
  }
}
