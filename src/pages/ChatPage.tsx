import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { revokeSessionOnServer } from '../api/auth'
import { MessageThread } from '../components/chat/MessageThread'
import { NewConversationModal } from '../components/chat/NewConversationModal'
import { Sidebar } from '../components/chat/Sidebar'
import { useConversations } from '../hooks/useConversations'
import { mergeWsMessageIntoCache, useMessages } from '../hooks/useMessages'
import { useSendMessage } from '../hooks/useSendMessage'
import { useWebSocket } from '../hooks/useWebSocket'
import type { ApiMessage } from '../types/api'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'

export function ChatPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setLoggingOut = useAuthStore((s) => s.setLoggingOut)
  const clear = useAuthStore((s) => s.clear)
  const { isLoading: conversationsLoading } = useConversations()

  const activeId = useChatStore((s) => s.activeConversationUserId)
  const conversations = useChatStore((s) => s.conversations)
  const mobilePane = useChatStore((s) => s.mobilePane)

  const peer = useMemo(
    () => conversations.find((c) => c.user_id === activeId),
    [activeId, conversations],
  )

  const {
    messagesChronological,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
    addOptimistic,
    replaceOptimistic,
    markOptimisticFailed,
    removeMessageById,
  } = useMessages(activeId)

  const wsHandler = useCallback(
    async (msg: ApiMessage, opts: { fromSelf: boolean; matchedTempId?: string }) => {
      const { user, privateKey } = useAuthStore.getState()
      const uid = user?.id
      if (!uid || !privateKey) return
      await mergeWsMessageIntoCache({
        queryClient,
        userId: uid,
        privateKey,
        msg,
        matchedTempId: opts.fromSelf ? opts.matchedTempId : undefined,
      })
    },
    [queryClient],
  )

  const { sendMessage } = useWebSocket(wsHandler)

  const { send } = useSendMessage(activeId, sendMessage, {
    addOptimistic,
    replaceOptimistic,
    markOptimisticFailed,
  })

  const onRetry = useCallback(
    (plain: string, tempId: string) => {
      removeMessageById(tempId)
      void send(plain)
    },
    [removeMessageById, send],
  )

  const [compose, setCompose] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await revokeSessionOnServer()
    } finally {
      clear()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-page">
      <div className="flex min-h-0 flex-1">
        <div
          className={`${mobilePane === 'sidebar' ? 'flex' : 'hidden'} h-full w-full shrink-0 md:flex md:w-[min(320px,100%)]`}
        >
          <Sidebar
            onCompose={() => setCompose(true)}
            conversationsLoading={conversationsLoading}
            onLogout={() => void handleLogout()}
          />
        </div>
        <div
          className={`${mobilePane === 'thread' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col md:flex`}
        >
          <MessageThread
            peerUserId={activeId}
            peerDisplayName={peer?.display_name ?? 'Chat'}
            peerUsername={peer?.username ?? ''}
            messages={messagesChronological}
            loading={messagesLoading}
            fetchNextPage={() => void fetchNextPage()}
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            onSend={(t) => void send(t)}
            onRetrySend={onRetry}
          />
        </div>
      </div>
      <NewConversationModal open={compose} onClose={() => setCompose(false)} />
    </div>
  )
}
