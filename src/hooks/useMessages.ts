import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
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

export function flattenMessagesChronological(
  pages: ChatMessageView[][],
): ChatMessageView[] {
  return pages
    .slice()
    .reverse()
    .flatMap((page) => [...page].reverse())
}

function dmPeerUserId(msg: ApiMessage, selfId: string): string {
  return msg.from_user_id === selfId ? msg.to_user_id : msg.from_user_id
}

function wirePayloadEqual(a: MessagePayloadWire, b: MessagePayloadWire): boolean {
  return (
    a.ciphertext === b.ciphertext &&
    a.iv === b.iv &&
    a.encryptedKey === b.encryptedKey &&
    a.encryptedKeyForSelf === b.encryptedKeyForSelf
  )
}

/** Merge a WebSocket `message.receive` into the peer’s infinite query cache (not the sidebar selection). */
export async function mergeWsMessageIntoCache(args: {
  queryClient: QueryClient
  userId: string
  privateKey: CryptoKey
  msg: ApiMessage
  matchedTempId?: string
}): Promise<void> {
  const { queryClient, userId, privateKey, msg, matchedTempId } = args
  const peer = dmPeerUserId(msg, userId)
  const qk = ['messages', peer]

  const mapped = await decryptOne(msg, userId, privateKey)

  if (matchedTempId) {
    queryClient.setQueryData(
      qk,
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
            if (m.id === matchedTempId) {
              replaced = true
              return mapped
            }
            return m
          }),
        )
        if (!replaced) {
          const first = pages[0] ?? []
          const dedupeTemp = first.filter(
            (m) =>
              !(
                m.id.startsWith('temp-') &&
                m.sendState === 'sending' &&
                wirePayloadEqual(m.payload, mapped.payload)
              ),
          )
          return {
            ...prev,
            pages: [
              [mapped, ...dedupeTemp.filter((m) => m.id !== mapped.id)],
              ...pages.slice(1),
            ],
          }
        }
        return { ...prev, pages }
      },
    )
    return
  }

  queryClient.setQueryData(
    qk,
    (prev: InfiniteData<ChatMessageView[]> | undefined) => {
      if (!prev) {
        return {
          pageParams: [undefined],
          pages: [[mapped]],
        }
      }
      const first = prev.pages[0] ?? []
      const withoutDupIds = first.filter((m) => m.id !== mapped.id)
      const withoutStaleOptimistic = withoutDupIds.filter(
        (m) =>
          !(
            msg.from_user_id === userId &&
            m.id.startsWith('temp-') &&
            m.sendState === 'sending' &&
            wirePayloadEqual(m.payload, mapped.payload)
          ),
      )
      return {
        ...prev,
        pages: [[mapped, ...withoutStaleOptimistic], ...prev.pages.slice(1)],
      }
    },
  )
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
    addOptimistic,
    replaceOptimistic,
    markOptimisticFailed,
    removeMessageById,
  }
}
