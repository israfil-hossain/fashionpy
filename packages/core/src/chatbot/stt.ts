import type { MedusaContainer } from "@medusajs/framework/types"

import { CHATBOT_MODULE } from "../modules/chatbot"
import type ChatbotModuleService from "../modules/chatbot/service"

/**
 * Voice-to-text for the chatbot. Uses the configured STT provider
 * (OpenAI Whisper-compatible endpoint or Gemini audio).
 */
export async function transcribeAudio(
  container: MedusaContainer,
  audio: { base64: string; mime_type?: string }
): Promise<string> {
  const service = container.resolve<ChatbotModuleService>(CHATBOT_MODULE)
  const runtime = await service.getRuntimeSettings()

  if (runtime.stt_provider === "none" || !runtime.stt_api_key) {
    throw new Error(
      "Voice input is not configured. Ask an admin to enable STT in Settings → AI Chatbot."
    )
  }

  const bytes = Buffer.from(audio.base64, "base64")
  const mimeType = audio.mime_type || "audio/webm"
  const extension = mimeType.includes("ogg")
    ? "ogg"
    : mimeType.includes("mp4")
      ? "m4a"
      : mimeType.includes("mpeg") || mimeType.includes("mp3")
        ? "mp3"
        : "webm"

  if (runtime.stt_provider === "openai") {
    const model = runtime.stt_model || "whisper-1"
    const form = new FormData()
    form.append(
      "file",
      new Blob([bytes], { type: mimeType }),
      `voice.${extension}`
    )
    form.append("model", model)
    form.append("language", "bn")

    const base =
      runtime.provider === "openrouter"
        ? "https://api.openai.com/v1"
        : "https://api.openai.com/v1"
    const res = await fetch(`${base}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${runtime.stt_api_key}` },
      body: form,
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`STT failed (${res.status}): ${text.slice(0, 300)}`)
    }
    const data = (await res.json()) as { text?: string }
    return data.text ?? ""
  }

  if (runtime.stt_provider === "gemini") {
    const model = runtime.stt_model || "gemini-2.0-flash"
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": runtime.stt_api_key,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Transcribe this audio exactly. Return only the transcription." },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: audio.base64,
                  },
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(60_000),
      }
    )
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Gemini STT failed (${res.status}): ${text.slice(0, 300)}`)
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  }

  throw new Error("Unsupported STT provider")
}
