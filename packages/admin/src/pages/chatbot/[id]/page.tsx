import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  Textarea,
  clx,
  toast,
} from "@medusajs/ui"
import { SparklesMini } from "@medusajs/icons"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  useChatbotConversation,
  useChatbotFollowupDraft,
  useSendChatbotAdminMessage,
  AdminChatbotMessageDTO,
} from "../../../hooks/api/chatbot"

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

const senderLabel = (message: AdminChatbotMessageDTO): string => {
  if (message.role === "user") return "Customer"
  return message.sender === "admin" ? "You (admin)" : "AI Assistant"
}

const MessageRow = ({ message }: { message: AdminChatbotMessageDTO }) => {
  const isCustomer = message.role === "user"
  const isAdmin = message.sender === "admin"
  const cards = (message.cards ?? []) as Array<Record<string, unknown>>

  return (
    <div
      className={clx(
        "flex flex-col gap-0.5",
        isCustomer ? "items-start" : "items-end"
      )}
    >
      <div
        className={clx(
          "max-w-[75%] rounded-lg px-3 py-2",
          isCustomer
            ? "bg-ui-bg-subtle text-ui-fg-base"
            : isAdmin
              ? "bg-ui-bg-interactive-subtle text-ui-fg-base"
              : "bg-ui-bg-field text-ui-fg-base"
        )}
        data-testid={`chatbot-admin-msg-${message.role}`}
      >
        <Text size="xsmall" className="mb-0.5 text-ui-fg-muted">
          {senderLabel(message)}
        </Text>
        <Text size="small" leading="compact">
          {message.content}
        </Text>
        {cards.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1 border-t border-ui-border-base pt-1.5">
            {cards.map((card, idx) => (
              <Text key={idx} size="xsmall" className="text-ui-fg-subtle">
                {card.type === "product"
                  ? `▸ ${String(card.title ?? "Product")}`
                  : `▸ Order #${String(card.display_id ?? card.order_group_id ?? "")}`}
              </Text>
            ))}
          </div>
        )}
      </div>
      <Text size="xsmall" className="px-1 text-ui-fg-muted">
        {formatTime(message.created_at)}
      </Text>
    </div>
  )
}

export const ChatbotConversationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const messagesRef = useRef<HTMLDivElement>(null)
  const [replyBody, setReplyBody] = useState("")

  const { conversation, messages, isLoading, isError, error } =
    useChatbotConversation(id!)

  const sendMessage = useSendChatbotAdminMessage(id!)
  const draftFollowup = useChatbotFollowupDraft(id!)

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages?.length])

  if (isError) throw error

  if (isLoading || !conversation) {
    return (
      <SingleColumnPage>
        <div className="flex items-center justify-center py-12">
          <Text className="text-ui-fg-muted">Loading conversation…</Text>
        </div>
      </SingleColumnPage>
    )
  }

  const handleSend = () => {
    const trimmed = replyBody.trim()
    if (!trimmed || sendMessage.isPending) return
    sendMessage.mutate(
      { content: trimmed },
      {
        onSuccess: () => {
          setReplyBody("")
          toast.success("Follow-up sent")
        },
        onError: (err) => toast.error(err.message || "Failed to send"),
      }
    )
  }

  const handleAiDraft = () => {
    if (draftFollowup.isPending) return
    draftFollowup.mutate(
      {},
      {
        onSuccess: ({ suggestion }) => {
          setReplyBody(suggestion)
        },
        onError: (err) =>
          toast.error(err.message || "Could not generate a draft"),
      }
    )
  }

  const customerName = conversation.customer
    ? [conversation.customer.first_name, conversation.customer.last_name]
        .filter(Boolean)
        .join(" ") || conversation.customer.email
    : "Guest"

  return (
    <SingleColumnPage data-testid="chatbot-conversation-page">
      <div className="flex min-h-0 gap-4">
        {/* Transcript */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-base">
          <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
            <div className="flex items-center gap-x-2">
              <Heading level="h2">{customerName}</Heading>
              <Badge
                color={conversation.status === "open" ? "green" : "grey"}
                size="small"
              >
                {conversation.status}
              </Badge>
              <Badge color="blue" size="small">
                {conversation.locale === "bn" ? "বাংলা" : "English"}
              </Badge>
            </div>
          </div>

          <div
            ref={messagesRef}
            className="flex min-h-[320px] flex-col gap-3 overflow-y-auto px-6 py-4"
            data-testid="chatbot-transcript"
          >
            {(messages ?? []).map((msg) => (
              <MessageRow key={msg.id} message={msg} />
            ))}
            {!messages?.length && (
              <Text className="py-8 text-center text-ui-fg-muted">
                No messages in this conversation
              </Text>
            )}
          </div>

          {/* Composer: AI draft + admin send */}
          <div className="border-t border-ui-border-base px-6 py-4">
            <Text size="xsmall" className="mb-2 block text-ui-fg-muted">
              Sending as Marketplace Support — the customer sees it in their
              chat and gets a notification.
            </Text>
            <div className="mb-2 flex items-center gap-2">
              <Button
                size="small"
                variant="secondary"
                onClick={handleAiDraft}
                disabled={draftFollowup.isPending}
                isLoading={draftFollowup.isPending}
                data-testid="chatbot-ai-draft"
              >
                <SparklesMini className="mr-1" />
                {draftFollowup.isPending ? "Drafting…" : "AI draft"}
              </Button>
              {draftFollowup.isPending && (
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Writing a follow-up from this transcript…
                </Text>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a follow-up message…"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                className="flex-1 resize-none"
                rows={3}
                data-testid="chatbot-followup-input"
              />
              <Button
                size="small"
                onClick={handleSend}
                disabled={!replyBody.trim() || sendMessage.isPending}
                isLoading={sendMessage.isPending}
                data-testid="chatbot-followup-send"
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[280px] shrink-0">
          <Container className="divide-y p-0">
            <div className="px-6 py-4">
              <Text size="small" leading="compact" weight="plus">
                Conversation details
              </Text>
            </div>
            <div className="px-6 py-3">
              <Text size="xsmall" className="text-ui-fg-muted">
                Customer
              </Text>
              <Text size="small" leading="compact" data-testid="chatbot-customer-name">
                {customerName}
              </Text>
              {conversation.customer?.email && (
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {conversation.customer.email}
                </Text>
              )}
              {conversation.customer?.phone && (
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {conversation.customer.phone}
                </Text>
              )}
              {!conversation.customer && (
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Not signed in (pre-login chat)
                </Text>
              )}
            </div>
            <div className="px-6 py-3">
              <Text size="xsmall" className="text-ui-fg-muted">
                Created
              </Text>
              <Text size="small" leading="compact">
                {new Date(conversation.created_at).toLocaleString()}
              </Text>
            </div>
            <div className="px-6 py-3">
              <Text size="xsmall" className="text-ui-fg-muted">
                Last activity
              </Text>
              <Text size="small" leading="compact">
                {conversation.last_message_at
                  ? new Date(conversation.last_message_at).toLocaleString()
                  : "—"}
              </Text>
            </div>
            <div className="px-6 py-3">
              <Text size="xsmall" className="text-ui-fg-muted">
                Messages
              </Text>
              <Text size="small" leading="compact">
                {messages?.length ?? 0}
              </Text>
            </div>
          </Container>
        </div>
      </div>
    </SingleColumnPage>
  )
}

export const Component = ChatbotConversationDetailPage
