"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale } from "@/components/providers/Locale/LocaleProvider"
import { retrieveCustomer } from "@/lib/data/customer"
import { CloseIcon, MessageIcon, TickHeavyIcon, WhatsAppIcon } from "@/icons"
import {
  getSpeechRecognitionCtor,
  speechLangFor,
  type SpeechRecognitionLike,
} from "@/lib/speech"
import { whatsappHref } from "@/data/support"
import { FoxAssistantIcon } from "./FoxAssistantIcon"

type Card =
  | {
      type: "product"
      id: string
      title: string
      handle?: string | null
      thumbnail?: string | null
      price?: string | null
      url?: string | null
    }
  | {
      type: "order"
      order_group_id: string
      display_id?: number | null
      status?: string | null
      fulfillment_status?: string | null
      payment_status?: string | null
      total?: string | null
      url?: string | null
      shipments?: Array<{
        id: string
        status: string
        tracking_number?: string | null
        tracking_url?: string | null
        carrier?: string | null
      }>
    }

type UiMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  cards?: Card[]
}

type UiLang = "en" | "bn"

const CONV_KEY = "mercur_chatbot_conv"
const LANG_KEY = "mercur_chatbot_lang"

/** Readable stack: Latin display face + Bengali fallback that actually covers া-ি. */
const CHAT_FONT =
  '"Funnel Display", "Noto Sans Bengali", "Hind Siliguri", system-ui, -apple-system, "Segoe UI", sans-serif'

const UI: Record<UiLang, Record<string, string>> = {
  en: {
    title: "Shopping Assistant",
    subtitle: "Ask in English or Bangla",
    close: "Close chat",
    welcome:
      "Hi! I can help you find products, place orders, and track delivery.\nTry: “show me facewash”",
    placeholder: "Type a message…",
    send: "Send",
    thinking: "Thinking…",
    voice: "Hold to talk",
    langLabel: "Language",
    viewProduct: "View product",
    order: "Order",
    payment: "Payment",
    delivery: "Delivery",
    emptyOrders: "No orders yet",
    errorRetry: "Something went wrong. Try again.",
    micRecording: "Recording… release to send",
    gateTitle: "Login Required",
    gateBody:
      "You must be logged in to access live chat and communicate with our support team.",
    gateLogin: "Login to Account",
    gateOr: "OR",
    gateWhatsapp: "Chat via WhatsApp",
  },
  bn: {
    title: "শপিং সহায়ক",
    subtitle: "বাংলা বা English-এ জিজ্ঞেস করুন",
    close: "চ্যাট বন্ধ করুন",
    welcome:
      "হাই! আমি পণ্য খুঁজে দিতে, অর্ডার করতে এবং ডেলিভারি ট্র্যাক করতে সাহায্য করতে পারি।\nলিখুন: “facewash দেখাও”",
    placeholder: "মেসেজ লিখুন…",
    send: "পাঠান",
    thinking: "ভাবছি…",
    voice: "কথা বলুন",
    langLabel: "ভাষা",
    viewProduct: "পণ্য দেখুন",
    order: "অর্ডার",
    payment: "পেমেন্ট",
    delivery: "ডেলিভারি",
    emptyOrders: "এখনো কোনো অর্ডার নেই",
    errorRetry: "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    micRecording: "রেকর্ড হচ্ছে… ছাড়লে পাঠাবে",
    gateTitle: "লগইন প্রয়োজন",
    gateBody:
      "লাইভ চ্যাট ব্যবহার করতে এবং সাপোর্ট টিমের সাথে কথা বলতে আপনাকে অবশ্যই লগইন করতে হবে।",
    gateLogin: "অ্যাকাউন্টে লগইন করুন",
    gateOr: "অথবা",
    gateWhatsapp: "WhatsApp-এ চ্যাট করুন",
  },
}

function localeFor(region: string): UiLang {
  return region === "bd" || region === "bn" ? "bn" : "en"
}

function detectLocale(text: string): UiLang {
  return /[\u0980-\u09FF]/.test(text) ? "bn" : "en"
}

function readStoredLang(region: string): UiLang {
  if (typeof window === "undefined") return localeFor(region)
  const stored = localStorage.getItem(LANG_KEY)
  return stored === "en" || stored === "bn" ? stored : localeFor(region)
}

export const ChatbotWidget = ({
  isLoggedIn = false,
}: {
  isLoggedIn?: boolean
}) => {
  const region = useLocale()
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<UiLang>("en")
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  // Live session check — the layout prop can be stale when Next serves a
  // cached layout segment after login (SPEC-011).
  const [authed, setAuthed] = useState(isLoggedIn)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const speechRef = useRef<SpeechRecognitionLike | null>(null)
  const speechBaseRef = useRef("")
  const speechFinalRef = useRef("")
  const speechInterimRef = useRef("")
  const speechFinishRef = useRef<((send: boolean) => void) | null>(null)
  const speechWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const t = UI[lang]
  const bn = lang === "bn"

  useEffect(() => {
    setLang(readStoredLang(region))
  }, [region])

  useEffect(() => {
    fetch("/api/chatbot/config")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  // SPEC-011: notification deep link `?chat=1` opens the panel and strips
  // the param (shallow history update — no navigation).
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("chat") !== "1") return
    setOpen(true)
    params.delete("chat")
    const qs = params.toString()
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
    )
  }, [])

  // SPEC-011: load server history when the panel opens (shows admin
  // follow-ups sent while the customer was away). Deliberately NOT refetched
  // after every send — replacing the transcript each turn re-rendered every
  // past product-card list. The visibility handler below covers refreshes.
  // A 404 means the stored id is a stale guest-era conversation — drop it
  // and start fresh on next send.
  const fetchHistory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chatbot/conversations/${id}`)
      if (res.status === 404) {
        sessionStorage.removeItem(CONV_KEY)
        setConversationId(null)
        return
      }
      if (!res.ok) return
      const data = await res.json()
      const rows = (data?.messages ?? []) as Array<{
        id: string
        role: string
        content: string | null
        cards?: Card[] | null
      }>
      setMessages(
        rows
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content ?? "",
            cards: m.cards ?? [],
          }))
      )
    } catch {
      // History is a nicety — the chat still works without it.
    }
  }, [])

  useEffect(() => {
    if (!open || !authed) return
    const stored = sessionStorage.getItem(CONV_KEY)
    if (!stored) return
    setConversationId((current) => current ?? stored)
    void fetchHistory(stored)
  }, [open, authed, fetchHistory])

  // Refresh when the customer returns to the tab (an admin follow-up may
  // have landed while they were away).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return
      if (!open || !authed || busy) return
      const stored = sessionStorage.getItem(CONV_KEY)
      if (stored) void fetchHistory(stored)
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [open, authed, busy, fetchHistory])

  // SPEC-011: keep the live session in sync — the layout prop can be stale
  // when Next reuses a cached layout segment, and sessions can expire.
  useEffect(() => {
    setAuthed(isLoggedIn)
  }, [isLoggedIn])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    retrieveCustomer()
      .then((u) => {
        if (!cancelled) setAuthed(!!u)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [open])

  const switchLang = (next: UiLang) => {
    setLang(next)
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      /* ignore */
    }
  }

  // Full navigation (not router) so the server layout re-renders with the
  // fresh session; `?chat=1` brings the customer straight back to this chat.
  const handleLogin = () => {
    const redirect = encodeURIComponent(`/${region}/?chat=1`)
    window.location.href = `/${region}/login?redirect=${redirect}`
  }

  const whatsappMessage = bn
    ? "হাই! FashionPy সাপোর্টে সাহায্য দরকার।"
    : "Hi! I need help from FashionPy support."

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId
    const stored =
      typeof window !== "undefined" ? sessionStorage.getItem(CONV_KEY) : null
    if (stored) {
      setConversationId(stored)
      return stored
    }
    const res = await fetch("/api/chatbot/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ locale: lang }),
    })
    const data = await res.json()
    const id = data?.conversation?.id as string | undefined
    if (!id) throw new Error(data?.error || "Could not start chat")
    sessionStorage.setItem(CONV_KEY, id)
    setConversationId(id)
    return id
  }, [conversationId, lang])

  const parseSse = (
    buffer: string
  ): { parts: string[]; rest: string } => {
    const segments = buffer.split("\n\n")
    const rest = segments.pop() ?? ""
    return { parts: segments, rest }
  }

  const applyEvent = (
    eventType: string,
    payload: any,
    state: {
      assistantId: string
      assistantText: { current: string }
      assistantCards: { current: Card[] }
    }
  ) => {
    const { assistantId, assistantText, assistantCards } = state

    if (eventType === "delta" && payload.text) {
      assistantText.current += payload.text
      const text = assistantText.current
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: text } : m
        )
      )
    } else if (eventType === "card" && payload.card) {
      assistantCards.current = [...assistantCards.current, payload.card]
      const cards = assistantCards.current
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, cards: [...(m.cards ?? []), payload.card] } : m
        )
      )
      void cards
    } else if (eventType === "transcript" && payload.text) {
      setMessages((prev) => {
        const trimmed = [...prev]
        while (
          trimmed.length &&
          trimmed[trimmed.length - 1].role === "assistant" &&
          !trimmed[trimmed.length - 1].content
        ) {
          trimmed.pop()
        }
        if (trimmed.length && trimmed[trimmed.length - 1].role === "user") {
          trimmed[trimmed.length - 1] = {
            ...trimmed[trimmed.length - 1],
            content: payload.text,
          }
          return trimmed
        }
        return [
          ...trimmed,
          { id: `u_${Date.now()}`, role: "user", content: payload.text, cards: [] },
        ]
      })
    } else if (eventType === "error") {
      throw new Error(payload.error || "Assistant error")
    } else if (eventType === "done") {
      assistantText.current = payload.content || assistantText.current
      if (payload.cards?.length) {
        assistantCards.current = payload.cards
      }
      const text = assistantText.current
      const cards = assistantCards.current
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: text, cards } : m
        )
      )
    }
  }

  const streamReply = async (
    url: string,
    body: unknown,
    assistantId: string
  ) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || data?.message || "Request failed")
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    const assistantText = { current: "" }
    const assistantCards = { current: [] as Card[] }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const { parts, rest } = parseSse(buffer)
      buffer = rest

      for (const part of parts) {
        const eventMatch = part.match(/^event:\s*(.+)$/m)
        const dataMatch = part.match(/^data:\s*(.+)$/m)
        if (!eventMatch || !dataMatch) continue
        let payload: any
        try {
          payload = JSON.parse(dataMatch[1])
        } catch {
          continue
        }
        applyEvent(eventMatch[1].trim(), payload, {
          assistantId,
          assistantText,
          assistantCards,
        })
      }
    }

    if (!assistantText.current) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: bn
                  ? "দুঃখিত, উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।"
                  : "Sorry, no reply. Please try again.",
              }
            : m
        )
      )
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || busy) return
    setError(null)
    setBusy(true)
    setInput("")

    const detected = detectLocale(text)
    if (detected !== lang) {
      switchLang(detected)
    }

    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: "user", content: text, cards: [] },
    ])

    try {
      const id = await ensureConversation()
      const assistantId = `a_${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", cards: [] },
      ])
      await streamReply(
        `/api/chatbot/conversations/${id}/messages`,
        { content: text },
        assistantId
      )
    } catch (err) {
      setError((err as Error).message || t.errorRetry)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === "assistant" && !last.content) {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setBusy(false)
    }
  }

  // Free voice-to-text: the browser's Web Speech API (Google's engine in
  // Chrome/Edge) transcribes live into the input while the mic is held;
  // releasing sends. No API key or server round-trip. Browsers without it
  // fall back to MediaRecorder + the configured backend STT provider.
  const startDictation = (): boolean => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor || speechRef.current) return false

    speechBaseRef.current = input
    speechFinalRef.current = ""
    speechInterimRef.current = ""

    const rec = new Ctor()
    rec.lang = speechLangFor(lang)
    rec.continuous = true
    rec.interimResults = true

    let finished = false
    let errored = false

    // Single cleanup path for natural end, errors, and the stop watchdog —
    // must be idempotent so a late native `end` can't double-send.
    const finish = (send: boolean) => {
      if (finished) return
      finished = true
      if (speechWatchdogRef.current) {
        clearTimeout(speechWatchdogRef.current)
        speechWatchdogRef.current = null
      }
      const text = `${speechBaseRef.current}${speechFinalRef.current}${speechInterimRef.current}`.trim()
      speechBaseRef.current = ""
      speechFinalRef.current = ""
      speechInterimRef.current = ""
      if (speechRef.current === rec) speechRef.current = null
      if (speechFinishRef.current === finish) speechFinishRef.current = null
      setRecording(false)
      try {
        rec.abort()
      } catch {
        /* already inactive */
      }
      if (send && text) {
        void sendMessage(text)
      } else if (send && !text && !errored) {
        // Never fail silently: a too-quick tap or silence gets a hint instead
        // of a dead mic with no explanation.
        setError(
          bn
            ? "কিছু শোনা যায়নি — মাইক ধরে রেখে কথা বলুন।"
            : "Didn't catch that — hold the mic and speak."
        )
      }
    }
    speechFinishRef.current = finish

    rec.onresult = (event) => {
      let finalText = ""
      let interimText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0]?.transcript ?? ""
        } else {
          interimText += result[0]?.transcript ?? ""
        }
      }
      if (finalText) speechFinalRef.current += finalText
      speechInterimRef.current = interimText
      setInput(
        `${speechBaseRef.current}${speechFinalRef.current}${speechInterimRef.current}`
      )
    }

    rec.onerror = (event) => {
      const err = event.error
      if (err === "no-speech" || err === "aborted") return
      errored = true
      setError(
        err === "not-allowed" || err === "service-not-allowed"
          ? bn
            ? "মাইক্রোফোনের অনুমতি পাওয়া যায়নি।"
            : "Microphone permission denied."
          : err === "network"
            ? bn
              ? "ইন্টারনেট সংযোগ পাওয়া যায়নি — ভয়েস সার্ভিসে পৌঁছানো যায়নি।"
              : "Network error — can't reach the voice service."
            : err === "language-not-supported"
              ? bn
                ? "এই ভাষার জন্য ভয়েস সমর্থিত নয়।"
                : "Voice isn't supported for this language."
              : err === "audio-capture"
                ? bn
                  ? "মাইক্রোফোন ব্যবহার করা যাচ্ছে না।"
                  : "Microphone unavailable."
                : bn
                  ? "ভয়েস ইনপুট ব্যর্থ হয়েছে।"
                  : "Voice input failed."
      )
    }

    rec.onend = () => finish(true)

    try {
      rec.start()
    } catch {
      speechFinishRef.current = null
      return false
    }
    speechRef.current = rec
    setError(null)
    setRecording(true)
    return true
  }

  const stopDictation = () => {
    if (!speechRef.current) return
    try {
      speechRef.current.stop()
    } catch {
      speechFinishRef.current?.(true)
      return
    }
    // Chrome normally fires `end` right after stop(); if it never does, the
    // watchdog force-finishes so the mic can't get stuck in "recording".
    if (speechWatchdogRef.current) clearTimeout(speechWatchdogRef.current)
    speechWatchdogRef.current = setTimeout(() => {
      speechWatchdogRef.current = null
      speechFinishRef.current?.(true)
    }, 4000)
  }

  const startVoice = () => {
    if (busy || recording) return
    if (startDictation()) return
    void startRecording()
  }

  const stopVoice = () => {
    if (speechRef.current) {
      stopDictation()
      return
    }
    stopRecording()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((tk) => tk.stop())
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        if (blob.size < 500) return
        await sendVoice(blob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch (err) {
      setError((err as Error).message || "Microphone unavailable")
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const sendVoice = async (blob: Blob) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const id = await ensureConversation()
      const buffer = await blob.arrayBuffer()
      let binary = ""
      const bytes = new Uint8Array(buffer)
      const chunk = 0x8000
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
      }
      const assistantId = `a_${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: `u_${Date.now()}`, role: "user", content: "🎤 …", cards: [] },
        { id: assistantId, role: "assistant", content: "", cards: [] },
      ])
      await streamReply(
        `/api/chatbot/conversations/${id}/voice`,
        { audio_base64: btoa(binary), mime_type: blob.type || "audio/webm" },
        assistantId
      )
    } catch (err) {
      setError((err as Error).message || t.errorRetry)
    } finally {
      setBusy(false)
    }
  }

  if (!enabled) return null

  return (
    <div
      className="fixed bottom-3 right-3 z-[70] flex flex-col items-end gap-3 sm:bottom-5 sm:right-5"
      data-testid="chatbot-widget"
      style={{ fontFamily: CHAT_FONT }}
    >
      {!open && (
        <button
          type="button"
          aria-label={bn ? "সহায়ক খুলুন" : "Open shopping assistant"}
          onClick={() => setOpen(true)}
          className="group relative flex items-end justify-center transition hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e2578c]/40"
          data-testid="chatbot-launcher"
          title={bn ? "সহায়ক খুলুন" : "Open shopping assistant"}
        >
          {/* Animated fox only — responsive: smaller on mobile, larger on laptop */}
          <FoxAssistantIcon
            size={128}
            showBubbles
            animate
            title="Open shopping assistant"
            className="relative h-auto w-[88px] drop-shadow-[0_4px_12px_rgba(180,40,90,0.25)] sm:w-[112px] lg:w-[132px]"
          />
          <span className="absolute bottom-3 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white sm:h-3.5 sm:w-3.5" />
        </button>
      )}

      {open && (
        <div
          className="flex h-[min(78vh,600px)] w-[min(94vw,400px)] flex-col overflow-hidden rounded-3xl border border-[#f3d0de] bg-[#fffafc] shadow-[0_24px_64px_rgba(180,40,90,0.22)]"
          data-testid="chatbot-panel"
          role="dialog"
          aria-label={t.title}
        >
          {/* Header */}
          <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-[#d84077] to-[#e2578c] px-3.5 py-3 text-white">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 shadow-sm">
              <FoxAssistantIcon size={28} showBubbles={false} animate={false} title="" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] font-semibold leading-tight tracking-normal">
                {t.title}
              </div>
              <div className="truncate text-[14px] font-normal leading-tight text-white/90">
                {t.subtitle}
              </div>
            </div>

            {/* Language toggle */}
            <div
              className="flex shrink-0 items-center rounded-full bg-white/20 p-0.5"
              role="group"
              aria-label={t.langLabel}
              data-testid="chatbot-lang"
            >
              {(["en", "bn"] as UiLang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => switchLang(code)}
                  aria-pressed={lang === code}
                  className={`rounded-full px-3 py-1.5 text-[14px] font-semibold leading-none transition ${
                    lang === code
                      ? "bg-white text-[#d84077] shadow-sm"
                      : "text-white/90 hover:text-white"
                  }`}
                  data-testid={`chatbot-lang-${code}`}
                >
                  {code === "en" ? "EN" : "বাং"}
                </button>
              ))}
            </div>

            {/* Close — always white on pink header */}
            <button
              type="button"
              aria-label={t.close}
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              data-testid="chatbot-close"
            >
              <CloseIcon size={22} color="#ffffff" />
            </button>
          </div>

          {/* Login gate (SPEC-011) — shown instead of messages/composer
              until the customer signs in. */}
          {!authed && (
            <div
              className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center"
              data-testid="chatbot-gate"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f8e4ed]">
                <MessageIcon size={30} color="#d84077" />
              </div>
              <div className="text-[19px] font-semibold leading-tight text-[#2a1520]">
                {t.gateTitle}
              </div>
              <p className="max-w-[300px] text-[14px] leading-relaxed text-[#6b4555]">
                {t.gateBody}
              </p>
              <button
                type="button"
                onClick={handleLogin}
                className="h-12 w-full max-w-[300px] rounded-full bg-[#d84077] text-[15px] font-semibold text-white transition hover:bg-[#c42b6e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e2578c]"
                data-testid="chatbot-gate-login"
              >
                {t.gateLogin}
              </button>
              <div className="flex w-full max-w-[300px] items-center gap-3 text-[13px] font-medium text-[#b07a92]">
                <span className="h-px flex-1 bg-[#f3d0de]" />
                {t.gateOr}
                <span className="h-px flex-1 bg-[#f3d0de]" />
              </div>
              <a
                href={whatsappHref(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full max-w-[300px] items-center justify-center gap-2 rounded-full border border-[#25d366]/50 bg-[#f0fdf4] text-[15px] font-semibold text-[#128c7e] transition hover:bg-[#dcfce7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#25d366]"
                data-testid="chatbot-gate-whatsapp"
              >
                <WhatsAppIcon size={20} color="#128c7e" />
                {t.gateWhatsapp}
              </a>
            </div>
          )}

          {/* Messages */}
          {authed && (
          <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 bg-[#fffafc]">
            {messages.length === 0 && (
              <div className="flex gap-2">
                <div className="mt-1 shrink-0">
                  <FoxAssistantIcon size={28} showBubbles={false} animate={false} title="" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-[#f3d0de] bg-white px-4 py-3.5 text-[16px] leading-[1.6] font-normal text-[#3f2430] shadow-sm whitespace-pre-wrap">
                  {t.welcome}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                {m.role === "assistant" && (
                  <div className="mr-1.5 mt-1 shrink-0 self-start">
                    <FoxAssistantIcon size={24} showBubbles={false} animate={false} title="" />
                  </div>
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[82%] rounded-2xl rounded-br-md bg-[#d84077] px-4 py-3 text-[16px] leading-[1.6] font-normal text-white shadow-sm"
                      : "max-w-[88%] space-y-2 rounded-2xl rounded-tl-md border border-[#f3d0de] bg-white px-4 py-3 text-[16px] leading-[1.6] font-normal text-[#3f2430] shadow-sm"
                  }
                  data-testid={`chatbot-msg-${m.role}`}
                >
                  {m.content && (
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  )}

                  {m.cards && m.cards.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      {m.cards.map((card, idx) =>
                        card.type === "product" ? (
                          <a
                            key={`p_${card.id}_${idx}`}
                            href={
                              card.url ||
                              (card.handle ? `/${region}/products/${card.handle}` : "#")
                            }
                            className="flex gap-3 rounded-xl border border-[#f3d0de] bg-[#fffafc] p-3 transition hover:border-[#e2578c] hover:shadow-sm"
                            data-testid="chatbot-product-card"
                          >
                            {card.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={card.thumbnail}
                                alt={card.title}
                                className="h-16 w-16 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-16 w-16 shrink-0 rounded-lg bg-[#f8e4ed]" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#2a1520]">
                                {card.title}
                              </div>
                              {card.price && (
                                <div className="mt-1 text-[16px] font-semibold text-[#d84077]">
                                  {card.price}
                                </div>
                              )}
                              <div className="mt-1 text-[14px] font-medium text-[#a14a6e]">
                                {t.viewProduct} →
                              </div>
                            </div>
                          </a>
                        ) : (
                          <a
                            key={`o_${card.order_group_id}_${idx}`}
                            href={card.url || `/${region}/user/orders/${card.order_group_id}`}
                            className="block rounded-xl border border-[#f3d0de] bg-[#fffafc] p-3 transition hover:border-[#e2578c] hover:shadow-sm"
                            data-testid="chatbot-order-card"
                          >
                            <div className="flex items-center justify-between gap-2 text-[15px]">
                              <span className="font-semibold text-[#2a1520]">
                                {t.order} #{card.display_id ?? card.order_group_id.slice(0, 8)}
                              </span>
                              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[14px] font-semibold text-emerald-700">
                                <TickHeavyIcon size={14} />
                                {card.status}
                              </span>
                            </div>
                            <div className="mt-1.5 text-[14px] leading-relaxed text-[#6b4555]">
                              {t.payment}: {card.payment_status ?? "—"} · {t.delivery}:{" "}
                              {card.fulfillment_status ??
                                card.shipments?.[0]?.status ??
                                "—"}
                            </div>
                            {card.total && (
                              <div className="mt-1.5 text-[15px] font-semibold text-[#d84077]">
                                {card.total}
                              </div>
                            )}
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div
                className="flex items-center gap-2.5 pl-10 text-[20px] font-semibold leading-snug tracking-normal text-[#a14a6e]"
                data-testid="chatbot-typing"
              >
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#e2578c] [animation-delay:0ms]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#e2578c] [animation-delay:150ms]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#e2578c] [animation-delay:300ms]" />
                </span>
                {t.thinking}
              </div>
            )}

            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-700"
                data-testid="chatbot-error"
              >
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          )}

          {/* Composer */}
          {authed && (
          <form
            className="flex items-center gap-2 border-t border-[#f3d0de] bg-white px-3 py-3.5"
            onSubmit={(e) => {
              e.preventDefault()
              void sendMessage(input)
            }}
          >
            <button
              type="button"
              aria-label={recording ? t.micRecording : t.voice}
              title={recording ? t.micRecording : t.voice}
              onMouseDown={startVoice}
              onMouseUp={stopVoice}
              onMouseLeave={() => recording && stopVoice()}
              onTouchStart={(e) => {
                e.preventDefault()
                startVoice()
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                stopVoice()
              }}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[17px] transition ${
                recording
                  ? "bg-[#d84077] text-white shadow-md ring-2 ring-[#e2578c]/40"
                  : "bg-[#f8e4ed] text-[#d84077] hover:bg-[#f3d0de]"
              }`}
              data-testid="chatbot-mic"
            >
              {recording ? "●" : "🎤"}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="h-12 min-w-0 flex-1 rounded-full border border-[#f3d0de] bg-[#fffafc] px-5 text-[16px] font-normal text-[#2a1520] placeholder:text-[#b07a92] outline-none transition focus:border-[#e2578c] focus:bg-white focus:ring-2 focus:ring-[#e2578c]/20"
              disabled={busy}
              data-testid="chatbot-input"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="h-12 shrink-0 rounded-full bg-[#d84077] px-5 text-[15px] font-semibold text-white transition hover:bg-[#c42b6e] disabled:opacity-40"
              data-testid="chatbot-send"
            >
              {t.send}
            </button>
          </form>
          )}
        </div>
      )}
    </div>
  )
}
