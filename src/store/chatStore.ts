import { create } from 'zustand'
import type { ConversationSummary } from '../types/api'

export type MobilePane = 'sidebar' | 'thread'

interface ChatState {
  conversations: ConversationSummary[]
  setConversations: (list: ConversationSummary[]) => void
  upsertConversation: (c: ConversationSummary) => void
  activeConversationUserId: string | null
  setActiveConversationUserId: (id: string | null) => void
  onlineUsers: Record<string, true>
  setUserOnline: (userId: string, online: boolean) => void
  mobilePane: MobilePane
  setMobilePane: (pane: MobilePane) => void
  wsConnected: boolean
  setWsConnected: (v: boolean) => void
  wsReconnecting: boolean
  setWsReconnecting: (v: boolean) => void
  /** FIFO temp ids per peer for matching WebSocket echoes */
  pendingOutgoing: Record<string, string[]>
  pushPendingOutgoing: (peerId: string, tempId: string) => void
  popPendingOutgoing: (peerId: string) => string | undefined
  removePendingOutgoing: (peerId: string, tempId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  setConversations: (list) => set({ conversations: list }),
  upsertConversation: (c) =>
    set((s) => {
      const rest = s.conversations.filter((x) => x.user_id !== c.user_id)
      const next = [...rest, c].sort((a, b) =>
        (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''),
      )
      return { conversations: next }
    }),
  activeConversationUserId: null,
  setActiveConversationUserId: (id) => set({ activeConversationUserId: id }),
  onlineUsers: {},
  setUserOnline: (userId, online) =>
    set((s) => {
      const next = { ...s.onlineUsers }
      if (online) next[userId] = true
      else delete next[userId]
      return { onlineUsers: next }
    }),
  mobilePane: 'sidebar',
  setMobilePane: (pane) => set({ mobilePane: pane }),
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),
  wsReconnecting: false,
  setWsReconnecting: (v) => set({ wsReconnecting: v }),
  pendingOutgoing: {},
  pushPendingOutgoing: (peerId, tempId) =>
    set((s) => {
      const q = s.pendingOutgoing[peerId] ?? []
      return {
        pendingOutgoing: { ...s.pendingOutgoing, [peerId]: [...q, tempId] },
      }
    }),
  popPendingOutgoing: (peerId) => {
    const q = get().pendingOutgoing[peerId] ?? []
    if (!q.length) return undefined
    const [head, ...rest] = q
    set((s) => ({
      pendingOutgoing: { ...s.pendingOutgoing, [peerId]: rest },
    }))
    return head
  },
  removePendingOutgoing: (peerId, tempId) =>
    set((s) => {
      const q = s.pendingOutgoing[peerId] ?? []
      return {
        pendingOutgoing: {
          ...s.pendingOutgoing,
          [peerId]: q.filter((id) => id !== tempId),
        },
      }
    }),
}))
