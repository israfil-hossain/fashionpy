import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  clx,
  toast,
  usePrompt,
} from "@medusajs/ui";

import {
  useAdminConversation,
  useSendAdminReply,
  useMarkAdminRead,
  useBlockCustomer,
  useUnblockCustomer,
  AdminMessageDTO,
} from "../../../hooks/api/messaging";
import { useAdminMessagingSSE } from "../../../hooks/api/use-admin-messaging-sse";
import { useMessagingLayout } from "../../../hooks/use-messaging-layout";

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const MessageRow = ({ message }: { message: AdminMessageDTO }) => {
  const isCustomer = message.sender_type === "customer";
  const isAdmin = message.sender_type === "admin";

  return (
    <div
      className={clx(
        "flex flex-col gap-0.5",
        isCustomer || isAdmin ? "items-start" : "items-end"
      )}
    >
      {message.context_type && (
        <Badge color="grey" size="2xsmall">
          {message.context_label || `${message.context_type}: ${message.context_id}`}
        </Badge>
      )}
      <div
        className={clx(
          "max-w-[70%] rounded-lg px-3 py-2",
          isCustomer
            ? "bg-ui-bg-subtle text-ui-fg-base"
            : isAdmin
              ? "bg-ui-bg-interactive-subtle text-ui-fg-base"
              : "bg-ui-bg-field text-ui-fg-base"
        )}
      >
        <Text size="xsmall" className="text-ui-fg-muted mb-0.5">
          {isCustomer ? "Customer" : isAdmin ? "Support" : "Vendor"}
        </Text>
        <Text size="small" leading="compact">
          {message.body}
        </Text>
      </div>
      <Text size="xsmall" className="text-ui-fg-muted px-1">
        {formatTime(message.created_at)}
        {message.read_at && " · Read"}
      </Text>
    </div>
  );
};

export const AdminConversationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  useAdminMessagingSSE(id);
  const prompt = usePrompt();

  const rootRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const blockMutation = useBlockCustomer();
  const unblockMutation = useUnblockCustomer();

  const {
    conversation,
    messages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useAdminConversation(id!);

  useMessagingLayout();

  const isSupport = (conversation?.type ?? "marketplace") !== "marketplace";

  const sendReply = useSendAdminReply(id!);
  const markRead = useMarkAdminRead(id!);

  // Mark support-thread messages read on open (marketplace stays read-only
  // oversight — never touches human read state).
  useEffect(() => {
    if (
      isSupport &&
      conversation &&
      (conversation.unread_count_admin ?? 0) > 0
    ) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, conversation?.unread_count_admin, isSupport]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages?.length]);

  const handleBlock = () => {
    if (!conversation?.buyer_id) return;
    blockMutation.mutate(
      {
        customer_id: conversation.buyer_id,
        reason: blockReason || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Customer blocked from chat");
          setShowBlockDialog(false);
          setBlockReason("");
        },
        onError: () => {
          toast.error("Failed to block customer");
        },
      }
    );
  };

  const handleUnblock = async () => {
    if (!conversation?.buyer_id) return;
    const confirmed = await prompt({
      title: "Unblock Customer",
      description:
        "Are you sure you want to unblock this customer? They will be able to use chat again.",
    });
    if (!confirmed) return;

    unblockMutation.mutate(conversation.buyer_id, {
      onSuccess: () => {
        toast.success("Customer unblocked");
      },
      onError: () => {
        toast.error("Failed to unblock customer");
      },
    });
  };

  const handleSend = () => {
    const trimmed = replyBody.trim();
    if (!trimmed || sendReply.isPending) return;

    sendReply.mutate(
      { body: trimmed },
      { onSuccess: () => setReplyBody("") }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isError) throw error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-ui-fg-muted">Loading conversation...</Text>
      </div>
    );
  }

  const displayMessages = [...(messages ?? [])].reverse();

  return (
    <div ref={rootRef} className="flex gap-4 h-full min-h-0">
      {/* Main: thread — read-only for marketplace, replyable for support */}
      <div className="flex-1 flex flex-col min-h-0 bg-ui-bg-base rounded-lg shadow-elevation-card-rest overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base shrink-0">
          <div className="flex items-center gap-x-2">
            <Heading level="h2">
              {isSupport ? "Support thread" : "Conversation"}
            </Heading>
            <Badge color={isSupport ? "blue" : "grey"} size="small">
              {isSupport ? "Support" : "Read-only"}
            </Badge>
          </div>
        </div>
        <div
          ref={messagesContainerRef}
          className="flex-1 flex flex-col gap-3 px-6 py-4 overflow-y-auto min-h-0"
        >
          {hasNextPage && (
            <div className="flex justify-center shrink-0">
              <Button
                size="small"
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                isLoading={isFetchingNextPage}
              >
                Load older messages
              </Button>
            </div>
          )}
          {displayMessages.map((msg) => (
            <MessageRow key={msg.id} message={msg} />
          ))}
          {!displayMessages.length && (
            <Text className="text-ui-fg-muted text-center py-8">
              No messages in this conversation
            </Text>
          )}
        </div>

        {/* Composer — support threads only; marketplace stays oversight-only */}
        {isSupport && (
          <div className="border-t border-ui-border-base px-6 py-4 shrink-0">
            <Text size="xsmall" className="text-ui-fg-muted mb-2 block">
              You are replying as Marketplace Support. Your messages are visible
              to the conversation participants.
            </Text>
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none"
                rows={2}
              />
              <Button
                size="small"
                onClick={handleSend}
                disabled={!replyBody.trim() || sendReply.isPending}
                isLoading={sendReply.isPending}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: Conversation metadata */}
      <div className="w-[300px] shrink-0 overflow-y-auto">
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              Conversation Details
            </Text>
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Vendor
            </Text>
            <Text size="small" leading="compact">
              {conversation?.seller_name || conversation?.seller_id || "-"}
            </Text>
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Customer
            </Text>
            <div className="flex items-center gap-x-2">
              <Text size="small" leading="compact">
                {conversation?.buyer_name || conversation?.buyer_id || "-"}
              </Text>
              {conversation?.is_buyer_blocked && (
                <Badge color="red" size="2xsmall">
                  Blocked
                </Badge>
              )}
            </div>
            {conversation?.buyer_email && (
              <Text size="xsmall" className="text-ui-fg-subtle">
                {conversation.buyer_email}
              </Text>
            )}
            {conversation?.is_buyer_blocked && conversation?.block_reason && (
              <Text size="xsmall" className="text-ui-fg-error mt-1">
                Reason: {conversation.block_reason}
              </Text>
            )}
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Created
            </Text>
            <Text size="small" leading="compact">
              {conversation?.created_at
                ? new Date(conversation.created_at).toLocaleString()
                : "-"}
            </Text>
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Last Activity
            </Text>
            <Text size="small" leading="compact">
              {conversation?.last_message_at
                ? new Date(conversation.last_message_at).toLocaleString()
                : "-"}
            </Text>
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Message Count
            </Text>
            <Text size="small" leading="compact">
              {messages?.length ?? 0}
            </Text>
          </div>
        </Container>

        {/* Chat Block Management — marketplace oversight only */}
        {!isSupport && (
          <Container className="mt-4 p-0">
            <div className="px-6 py-4">
              <Text size="small" leading="compact" weight="plus">
                Chat Access
              </Text>
            </div>
            <div className="px-6 pb-4">
              {showBlockDialog ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label size="xsmall">Reason (optional)</Label>
                    <Input
                      size="small"
                      placeholder="Why is this customer being blocked?"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      variant="danger"
                      onClick={handleBlock}
                      disabled={blockMutation.isPending}
                      isLoading={blockMutation.isPending}
                    >
                      Confirm Block
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => {
                        setShowBlockDialog(false);
                        setBlockReason("");
                      }}
                      disabled={blockMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : conversation?.is_buyer_blocked ? (
                <Button
                  size="small"
                  variant="secondary"
                  onClick={handleUnblock}
                  disabled={unblockMutation.isPending}
                  isLoading={unblockMutation.isPending}
                >
                  Unblock Customer
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => setShowBlockDialog(true)}
                >
                  Block Customer
                </Button>
              )}
            </div>
          </Container>
        )}
      </div>
    </div>
  );
};
