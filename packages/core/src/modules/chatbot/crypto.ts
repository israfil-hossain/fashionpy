import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

const ALGO = "aes-256-gcm"

function getKey(): Buffer {
  const secret =
    process.env.CHATBOT_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    process.env.COOKIE_SECRET ||
    "mercur-chatbot-dev-secret"
  return createHash("sha256").update(secret).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
}

export function decryptSecret(payload: string): string | null {
  try {
    const [ivB64, tagB64, dataB64] = payload.split(".")
    if (!ivB64 || !tagB64 || !dataB64) return null
    const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64url"))
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"))
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    return null
  }
}
