import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  clx,
} from "@medusajs/ui";

import {
  useAdminConversations,
  AdminConversationDTO,
} from "../../hooks/api/messaging";
import { useAdminMessagingSSE } from "../../hooks/api/use-admin-messaging-sse";
import { useMessagingLayout } from "../../hooks/use-messaging-layout";

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
};

type TypeFilter = "all" | "support" | "marketplace";

const ConversationRow = ({
  conversation,
  onClick,
}: {
  conversation: AdminConversationDTO;
  onClick: () => void;
}) => {
  const conversationType = conversation.type ?? "marketplace";
  const isSupport = conversationType !== "marketplace";

  const counterpart = isSupport
    ? conversationType === "support_customer"
      ? conversation.buyer_name || conversation.buyer_id || "Customer"
      : conversation.seller_name || conversation.seller_id || "Vendor"
    : null;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-ui-bg-base-hover"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text size="small" leading="compact" weight="plus">
            {isSupport
              ? "Marketplace Support"
              : conversation.seller_name || conversation.seller_id}
          </Text>
          {isSupport && (
            <>
              <Text size="xsmall" className="text-ui-fg-muted">
                &harr;
              </Text>
              <Text size="small" leading="compact" weight="plus">
                {counterpart}
              </Text>
              <Badge color="blue" size="2xsmall">
                Support
              </Badge>
            </>
          )}
          {!isSupport && (
            <>
              <Text size="xsmall" className="text-ui-fg-muted">
                &harr;
              </Text>
              <Text size="small" leading="compact" weight="plus">
                {conversation.buyer_name || conversation.buyer_id}
              </Text>
            </>
          )}
          {conversation.is_buyer_blocked && (
            <Badge color="red" size="2xsmall">
              Blocked
            </Badge>
          )}
        </div>
        <Text
          size="small"
          leading="compact"
          className="text-ui-fg-subtle truncate mt-0.5"
        >
          {conversation.last_message_preview || "No messages"}
        </Text>
      </div>
      <div className="shrink-0 text-right">
        <Text size="xsmall" className="text-ui-fg-muted">
          {formatDate(conversation.last_message_at)}
        </Text>
        {conversation.buyer_email && (
          <Text size="xsmall" className="text-ui-fg-muted">
            {conversation.buyer_email}
          </Text>
        )}
      </div>
    </button>
  );
};

export const AdminMessagesPage = () => {
  useAdminMessagingSSE();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchParams, setSearchParams] = useState<{
    seller_name?: string;
    buyer_name?: string;
    date_from?: string;
    date_to?: string;
  }>({});

  const [formState, setFormState] = useState({
    seller_name: "",
    buyer_name: "",
    date_from: "",
    date_to: "",
  });

  const { conversations, isLoading, isError, error } = useAdminConversations({
    limit: 50,
    ...searchParams,
    // "support" chip shows both support types — query without the type filter
    // and rely on the API default (all types), then the row labels sort it out.
    ...(typeFilter === "marketplace" ? { type: "marketplace" as const } : {}),
  });

  useMessagingLayout();

  if (isError) throw error;

  const handleSearch = () => {
    setSearchParams({
      seller_name: formState.seller_name || undefined,
      buyer_name: formState.buyer_name || undefined,
      date_from: formState.date_from || undefined,
      date_to: formState.date_to || undefined,
    });
  };

  const handleClear = () => {
    setFormState({ seller_name: "", buyer_name: "", date_from: "", date_to: "" });
    setSearchParams({});
    setTypeFilter("all");
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Search Form */}
      <Container className="shrink-0 p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Messages</Heading>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="secondary"
              onClick={() => navigate("/messages/filters")}
            >
              Content filters
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => navigate("/messages/blocked")}
            >
              Blocked messages
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-3">
          {(["all", "support", "marketplace"] as TypeFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setTypeFilter(filter)}
              className={clx(
                "rounded-md px-3 py-1 text-sm capitalize transition-colors",
                typeFilter === filter
                  ? "bg-ui-bg-interactive text-ui-fg-on-color"
                  : "bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-subtle-hover"
              )}
            >
              {filter === "all" ? "All conversations" : filter}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 px-6 pb-4">
          <div>
            <Label size="xsmall">Vendor Name</Label>
            <Input
              size="small"
              placeholder="Search vendor..."
              value={formState.seller_name}
              onChange={(e) =>
                setFormState((s) => ({ ...s, seller_name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label size="xsmall">Customer Name</Label>
            <Input
              size="small"
              placeholder="Search customer..."
              value={formState.buyer_name}
              onChange={(e) =>
                setFormState((s) => ({ ...s, buyer_name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label size="xsmall">Date From</Label>
            <Input
              size="small"
              type="date"
              value={formState.date_from}
              onChange={(e) =>
                setFormState((s) => ({ ...s, date_from: e.target.value }))
              }
            />
          </div>
          <div>
            <Label size="xsmall">Date To</Label>
            <Input
              size="small"
              type="date"
              value={formState.date_to}
              onChange={(e) =>
                setFormState((s) => ({ ...s, date_to: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-4">
          <Button size="small" onClick={handleSearch}>
            Search
          </Button>
          <Button size="small" variant="secondary" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </Container>

      {/* Results */}
      <Container className="flex min-h-0 flex-1 flex-col divide-y p-0">
        <div className="shrink-0 px-6 py-4">
          <Text size="small" weight="plus">
            Conversations
          </Text>
        </div>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Text className="text-ui-fg-muted">Loading...</Text>
          </div>
        ) : !conversations?.length ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Text className="text-ui-fg-muted">No conversations found</Text>
          </div>
        ) : (
          <div className="flex-1 divide-y overflow-y-auto">
            {conversations
              .filter((conv) => {
                if (typeFilter === "marketplace") {
                  return (conv.type ?? "marketplace") === "marketplace";
                }
                if (typeFilter === "support") {
                  return (conv.type ?? "marketplace") !== "marketplace";
                }
                return true;
              })
              .map((conv) => (
                <ConversationRow
                  key={conv.id}
                  conversation={conv}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                />
              ))}
          </div>
        )}
      </Container>
    </div>
  );
};
