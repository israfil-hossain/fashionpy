import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { ClientError } from "@mercurjs/client";

import { sdk } from "../../lib/client";

const ADMIN_CONVERSATIONS_KEY = "admin_conversations" as const;
const ADMIN_CONVERSATION_KEY = "admin_conversation" as const;
const ADMIN_UNREAD_KEY = "admin_messaging_unread" as const;

export type AdminConversationType =
  | "marketplace"
  | "support_customer"
  | "support_vendor";

export type AdminConversationDTO = {
  id: string;
  type: AdminConversationType;
  thread_key: string;
  buyer_id: string | null;
  seller_id: string | null;
  buyer_name?: string | null;
  buyer_email?: string | null;
  seller_name?: string | null;
  last_message_preview: string | null;
  last_message_sender_type: "customer" | "seller" | "admin" | null;
  last_message_at: string | null;
  unread_count_customer: number;
  unread_count_seller: number;
  unread_count_admin: number;
  created_at: string;
  is_buyer_blocked?: boolean;
  block_reason?: string | null;
};

export type AdminMessageDTO = {
  id: string;
  sender_id: string;
  sender_type: "customer" | "seller" | "admin";
  body: string;
  context_type: "product" | "order" | null;
  context_id: string | null;
  context_label: string | null;
  read_at: string | null;
  created_at: string;
};

type AdminConversationListResponse = {
  conversations: AdminConversationDTO[];
  next_cursor: string | null;
};

type AdminConversationDetailResponse = {
  conversation: AdminConversationDTO;
  messages: AdminMessageDTO[];
  next_cursor: string | null;
};

type SearchParams = {
  cursor?: string;
  limit?: number;
  seller_name?: string;
  buyer_name?: string;
  date_from?: string;
  date_to?: string;
  context_type?: string;
  context_id?: string;
  type?: AdminConversationType;
};

export const useAdminConversations = (
  query?: SearchParams,
  options?: Omit<
    UseQueryOptions<AdminConversationListResponse, ClientError>,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: [ADMIN_CONVERSATIONS_KEY, query],
    queryFn: async () =>
      (sdk as any).admin.messages.query(
        query ?? {}
      ) as Promise<AdminConversationListResponse>,
    ...options,
  });

  return { ...data, ...rest };
};

export const useAdminConversation = (id: string, query?: { limit?: number }) => {
  const limit = query?.limit ?? 20;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, ...rest } =
    useInfiniteQuery<AdminConversationDetailResponse, ClientError>({
      queryKey: [ADMIN_CONVERSATION_KEY, id, { limit }],
      queryFn: async ({ pageParam }) =>
        (sdk as any).admin.messages.$id.query({
          $id: id,
          limit,
          ...(pageParam ? { cursor: pageParam } : {}),
        }) as Promise<AdminConversationDetailResponse>,
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    });

  const conversation = data?.pages[0]?.conversation;
  const messages = data?.pages.flatMap((p) => p.messages) ?? [];

  return {
    conversation,
    messages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    ...rest,
  };
};

export const useAdminUnread = (
  options?: Omit<
    UseQueryOptions<{ unread_count: number }, ClientError>,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: [ADMIN_UNREAD_KEY, "total"],
    queryFn: async () =>
      (sdk as any).admin.messages.unread.query() as Promise<{
        unread_count: number;
      }>,
    ...options,
  });

  return { ...data, ...rest };
};

/**
 * Admin reply — only allowed on support threads (the API rejects sends on
 * read-only marketplace oversight threads).
 */
export const useSendAdminReply = (
  conversationId: string,
  options?: UseMutationOptions<
    { message: AdminMessageDTO },
    ClientError,
    { body: string }
  >
) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  return useMutation({
    ...restOptions,
    mutationFn: (payload: { body: string }) =>
      (sdk as any).admin.messages.$id.mutate({
        $id: conversationId,
        ...payload,
      }) as Promise<{ message: AdminMessageDTO }>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [ADMIN_CONVERSATION_KEY, conversationId],
      });
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_KEY] });
      onSuccess?.(data, variables, context);
    },
    onError,
  });
};

export const useMarkAdminRead = (
  conversationId: string,
  options?: UseMutationOptions<{ success: boolean }, ClientError, void>
) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...restOptions } = options ?? {};

  return useMutation({
    ...restOptions,
    mutationFn: () =>
      (sdk as any).admin.messages.$id.read.mutate({
        $id: conversationId,
      }) as Promise<{ success: boolean }>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [ADMIN_CONVERSATION_KEY, conversationId],
      });
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_KEY] });
      onSuccess?.(data, variables, context);
    },
    onError,
  });
};

export const useBlockCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { customer_id: string; reason?: string }) =>
      (sdk as any).admin.messages["chat-blocks"].mutate(data) as Promise<{
        block: any;
      }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATION_KEY] });
    },
  });
};

export const useUnblockCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) =>
      (sdk as any).admin.messages["chat-blocks"].$customer_id.delete({
        $customer_id: customerId,
      }) as Promise<{ success: boolean }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATION_KEY] });
    },
  });
};
