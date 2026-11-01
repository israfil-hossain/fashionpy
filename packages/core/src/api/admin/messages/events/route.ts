import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

import { MESSAGING_REDIS_MODULE } from "../../../../modules/messaging-redis"
import type MessagingRedisModuleService from "../../../../modules/messaging-redis/service"

/**
 * EventSource cannot send Authorization headers, so this route trades the
 * panel's Bearer auth for a one-time token minted by POST
 * /admin/messages/sse-token (which is authenticated). The token's stored
 * value must be the shared admin channel — see sse-token/route.ts.
 */
export const AUTHENTICATE = false

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = req.query.token as string | undefined

  if (!token) {
    res.status(401).json({ message: "Missing token" })
    return
  }

  const redisService = req.scope.resolve<MessagingRedisModuleService>(MESSAGING_REDIS_MODULE)

  if (!redisService.isAvailable) {
    res.status(503).json({ message: "Token service unavailable" })
    return
  }

  let channel: string | null = null

  try {
    channel = await redisService.consumeToken(token)
  } catch {
    res.status(503).json({ message: "Token service unavailable" })
    return
  }

  // Reject tokens minted for other surfaces (store/vendor tokens carry a
  // user/seller id — those must not open the admin broadcast).
  if (!channel || channel !== "admin") {
    res.status(401).json({ message: "Invalid or expired token" })
    return
  }

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  })
  res.flushHeaders()

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(":heartbeat\n\n")
  }, 30000)

  let subscriber: ReturnType<MessagingRedisModuleService["createSubscriber"]> = null

  try {
    subscriber = redisService.createSubscriber()

    if (subscriber) {
      await subscriber.subscribe("messaging")

      // Shared support inbox + oversight: admin receives all messaging
      // events; the client invalidates the lists it renders.
      subscriber.on("message", (_channel: string, message: string) => {
        try {
          const event = JSON.parse(message)
          const eventId = event.message_id || `evt_${Date.now()}`
          const eventType = event.event_type || "message"

          res.write(`id: ${eventId}\n`)
          res.write(`event: ${eventType}\n`)
          res.write(`data: ${JSON.stringify(event)}\n\n`)
        } catch {
          // Skip malformed events
        }
      })
    }

    res.write(`event: connected\ndata: {"status":"connected"}\n\n`)

    // Handle Last-Event-ID (sanitize to prevent SSE frame injection)
    const lastEventId = req.query.last_event_id as string | undefined
    if (lastEventId) {
      const sanitized = lastEventId.replace(/[\n\r]/g, "")
      res.write(`event: reconnected\ndata: ${JSON.stringify({ last_event_id: sanitized })}\n\n`)
    }
  } catch {
    // Redis unavailable
  }

  req.on("close", async () => {
    clearInterval(heartbeat)
    if (subscriber) {
      try {
        subscriber.unsubscribe("messaging")
        subscriber.quit()
      } catch {
        // Best effort cleanup
      }
    }
  })
}
