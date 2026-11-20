import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
} from "@medusajs/ui"

import { SingleColumnPage } from "../../components/layout/pages"
import {
  useChatbotConversations,
  AdminChatbotConversationDTO,
} from "../../hooks/api/chatbot"

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString()
}

const customerLabel = (conversation: AdminChatbotConversationDTO): string => {
  if (!conversation.customer) return "Guest"
  const name = [conversation.customer.first_name, conversation.customer.last_name]
    .filter(Boolean)
    .join(" ")
  return name || conversation.customer.email
}

const ConversationRow = ({
  conversation,
  onClick,
}: {
  conversation: AdminChatbotConversationDTO
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-ui-bg-base-hover"
    data-testid="chatbot-inbox-row"
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <Text size="small" leading="compact" weight="plus">
          {customerLabel(conversation)}
        </Text>
        {!conversation.customer && (
          <Badge color="grey" size="2xsmall">
            Guest
          </Badge>
        )}
        <Badge
          color={conversation.status === "open" ? "green" : "grey"}
          size="2xsmall"
        >
          {conversation.status}
        </Badge>
        <Badge color="blue" size="2xsmall">
          {conversation.locale === "bn" ? "বাংলা" : "EN"}
        </Badge>
      </div>
      <Text
        size="small"
        leading="compact"
        className="mt-0.5 truncate text-ui-fg-subtle"
      >
        {conversation.last_message_preview || "No messages yet"}
      </Text>
    </div>
    <div className="shrink-0 text-right">
      <Text size="xsmall" className="text-ui-fg-muted">
        {formatDate(conversation.last_message_at)}
      </Text>
      {conversation.customer?.email && (
        <Text size="xsmall" className="text-ui-fg-muted">
          {conversation.customer.email}
        </Text>
      )}
    </div>
  </button>
)

export const ChatbotInboxPage = () => {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState("")
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all"
  )

  const { conversations, isLoading, isError, error } = useChatbotConversations({
    limit: 50,
    ...(q ? { q } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  })

  if (isError) throw error

  return (
    <SingleColumnPage data-testid="chatbot-inbox-page">
      <Container className="divide-y p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Heading level="h2">Chat Inbox</Heading>
          <div className="flex items-end gap-2">
            <div>
              <Label size="xsmall">Search</Label>
              <Input
                size="small"
                className="w-56"
                placeholder="Name, email or message…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setQ(searchInput.trim())
                }}
                data-testid="chatbot-inbox-search"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <Select.Trigger className="w-36" data-testid="chatbot-inbox-status">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All statuses</Select.Item>
                <Select.Item value="open">Open</Select.Item>
                <Select.Item value="closed">Closed</Select.Item>
              </Select.Content>
            </Select>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                setQ(searchInput.trim())
              }}
            >
              Search
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Text className="text-ui-fg-muted">Loading…</Text>
          </div>
        ) : !conversations?.length ? (
          <div className="flex flex-col items-center gap-1 py-12 text-center">
            <Text className="text-ui-fg-muted">No conversations yet</Text>
            <Text size="small" className="text-ui-fg-subtle">
              Chats from the storefront assistant appear here.
            </Text>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                onClick={() => navigate(`/chatbot/${conv.id}`)}
              />
            ))}
          </div>
        )}
      </Container>
    </SingleColumnPage>
  )
}

export const Component = ChatbotInboxPage
