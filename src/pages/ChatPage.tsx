import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoutServer } from '../api/auth'
import { MessageThread } from '../components/chat/MessageThread'
import { NewConversationModal } from '../components/chat/NewConversationModal'
import { Sidebar } from '../components/chat/Sidebar'
import { useConversations } from '../hooks/useConversations'
import { useMessages } from '../hooks/useMessages'
import { useSendMessage } from '../hooks/useSendMessage'
import { useWebSocket } from '../hooks/useWebSocket'
import type { ApiMessage } from '../types/api'
import { useChatStore } from '../store/chatStore'

export function ChatPage() {
  const navigate = useNavigate()
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
    appendIncoming,
    replaceOptimistic,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
    addOptimistic,
    markOptimisticFailed,
    removeMessageById,
  } = useMessages(activeId)

  const wsHandler = useCallback(
    async (msg: ApiMessage, opts: { fromSelf: boolean; matchedTempId?: string }) => {
      if (opts.fromSelf && opts.matchedTempId) {
        await replaceOptimistic(opts.matchedTempId, msg)
      } else {
        await appendIncoming(msg)
      }
    },
    [appendIncoming, replaceOptimistic],
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
    try {
      await logoutServer()
    } finally {
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
