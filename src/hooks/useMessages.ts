import { type InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { fetchMessages } from '../api/messages'
import { decryptMessagePayload } from '../crypto/messages'
import type { ApiMessage, MessagePayloadWire } from '../types/api'
import { useAuthStore } from '../store/authStore'

export interface ChatMessageView extends ApiMessage {
  plainText?: string
  decryptFailed?: boolean
  sendState?: 'sending' | 'error'
}

async function decryptOne(
  msg: ApiMessage,
  currentUserId: string,
  privateKey: CryptoKey,
): Promise<ChatMessageView> {
  const useSelf = msg.from_user_id === currentUserId
  try {
    const plainText = await decryptMessagePayload(msg.payload, useSelf, privateKey)
    return { ...msg, plainText, decryptFailed: false }
  } catch (e) {
    console.error(e)
    return { ...msg, decryptFailed: true }
  }
}

async function decryptPage(
  page: ApiMessage[],
  currentUserId: string,
  privateKey: CryptoKey,
): Promise<ChatMessageView[]> {
  return Promise.all(page.map((m) => decryptOne(m, currentUserId, privateKey)))
}

/** API returns newest-first per page; flatten to chronological (oldest → newest for chat UI). */
export function flattenMessagesChronological(
  pages: ChatMessageView[][],
): ChatMessageView[] {
  return pages
    .slice()
    .reverse()
    .flatMap((page) => [...page].reverse())
}

export function useMessages(peerUserId: string | null) {
  const userId = useAuthStore((s) => s.user?.id)
  const privateKey = useAuthStore((s) => s.privateKey)
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ['messages', peerUserId],
    enabled: Boolean(peerUserId && userId && privateKey),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      if (!peerUserId || !userId || !privateKey) return []
      const page = await fetchMessages(peerUserId, {
        limit: 50,
        before: pageParam,
      })
      return decryptPage(page, userId, privateKey)
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.length || lastPage.length < 50) return undefined
      const oldest = lastPage[lastPage.length - 1]
      return oldest?.created_at
    },
    staleTime: 5_000,
  })

  const messagesChronological = useMemo(
    () =>
      query.data ? flattenMessagesChronological(query.data.pages) : [],
    [query.data],
  )

  const appendIncoming = useCallback(
    async (incoming: ApiMessage) => {
      if (!peerUserId || !userId || !privateKey) return

      const relevant =
        incoming.from_user_id === peerUserId || incoming.to_user_id === peerUserId
      if (!relevant) return

      const mapped = await decryptOne(incoming, userId, privateKey)

      queryClient.setQueryData(
        ['messages', peerUserId],
        (prev: InfiniteData<ChatMessageView[]> | undefined) => {
          if (!prev) {
            return {
              pageParams: [undefined],
              pages: [[mapped]],
            }
          }
          const first = prev.pages[0] ?? []
          const withoutDup = first.filter((m) => m.id !== mapped.id)
          const nextFirst = [mapped, ...withoutDup]
          return {
            ...prev,
            pages: [nextFirst, ...prev.pages.slice(1)],
          }
        },
      )
    },
    [peerUserId, privateKey, queryClient, userId],
  )

  const addOptimistic = useCallback(
    (tempId: string, to: string, payload: MessagePayloadWire, plainText: string) => {
      if (!peerUserId || !userId) return
      const optimistic: ChatMessageView = {
        id: tempId,
        from_user_id: userId,
        to_user_id: to,
        payload,
        delivered: false,
        created_at: new Date().toISOString(),
        plainText,
        sendState: 'sending',
      }
      queryClient.setQueryData(
        ['messages', peerUserId],
        (prev: InfiniteData<ChatMessageView[]> | undefined) => {
          if (!prev) {
            return {
              pageParams: [undefined],
              pages: [[optimistic]],
            }
          }
          const first = prev.pages[0] ?? []
          return {
            ...prev,
            pages: [[optimistic, ...first], ...prev.pages.slice(1)],
          }
        },
      )
    },
    [peerUserId, queryClient, userId],
  )

  const replaceOptimistic = useCallback(
    async (tempId: string, real: ApiMessage) => {
      if (!peerUserId || !userId || !privateKey) return
      const mapped = await decryptOne(real, userId, privateKey)
      queryClient.setQueryData(
        ['messages', peerUserId],
        (prev: InfiniteData<ChatMessageView[]> | undefined) => {
          if (!prev) {
            return {
              pageParams: [undefined],
              pages: [[mapped]],
            }
          }
          let replaced = false
          const pages = prev.pages.map((page) =>
            page.map((m) => {
              if (m.id === tempId) {
                replaced = true
                return mapped
              }
              return m
            }),
          )
          if (!replaced) {
            const first = pages[0] ?? []
            return {
              ...prev,
              pages: [[mapped, ...first.filter((m) => m.id !== real.id)], ...pages.slice(1)],
            }
          }
          return { ...prev, pages }
        },
      )
    },
    [peerUserId, privateKey, queryClient, userId],
  )

  const markOptimisticFailed = useCallback(
    (tempId: string) => {
      if (!peerUserId) return
      queryClient.setQueryData(
        ['messages', peerUserId],
        (prev: InfiniteData<ChatMessageView[]> | undefined) => {
          if (!prev) return prev
          const pages = prev.pages.map((page) =>
            page.map((m) =>
              m.id === tempId ? { ...m, sendState: 'error' as const } : m,
            ),
          )
          return { ...prev, pages }
        },
      )
    },
    [peerUserId, queryClient],
  )

  const removeMessageById = useCallback(
    (id: string) => {
      if (!peerUserId) return
      queryClient.setQueryData(
        ['messages', peerUserId],
        (prev: InfiniteData<ChatMessageView[]> | undefined) => {
          if (!prev) return prev
          const pages = prev.pages.map((page) =>
            page.filter((m) => m.id !== id),
          )
          return { ...prev, pages }
        },
      )
    },
    [peerUserId, queryClient],
  )

  return {
    ...query,
    messagesChronological,
    appendIncoming,
    addOptimistic,
    replaceOptimistic,
    markOptimisticFailed,
    removeMessageById,
  }
}
