import { useEffect, useRef, type UIEvent } from 'react'
import type { ChatMessageView } from '../../hooks/useMessages'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { EncryptedBanner } from './EncryptedBanner'
import { ThreadHeader } from './ThreadHeader'

function SkeletonThread() {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`h-12 w-2/3 animate-pulse rounded-2xl ${
              i % 2 === 0 ? 'bg-surface' : 'bg-accent/40'
            }`}
          />
        </div>
      ))}
    </div>
  )
}

export function MessageThread({
  peerUserId,
  peerDisplayName,
  peerUsername,
  messages,
  loading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onSend,
  onRetrySend,
}: {
  peerUserId: string | null
  peerDisplayName: string
  peerUsername: string
  messages: ChatMessageView[]
  loading: boolean
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onSend: (t: string) => void | Promise<void>
  onRetrySend?: (plain: string, tempId: string) => void
}) {
  const selfId = useAuthStore((s) => s.user?.id)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const setPane = useChatStore((s) => s.setMobilePane)

  useEffect(() => {
    if (!peerUserId || loading) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [peerUserId, loading, messages.length])

  function onScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollTop < 40 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  if (!peerUserId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-thread text-sm text-muted">
        Select a conversation to start messaging.
      </div>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-thread">
      <div className="flex items-center gap-2 border-b border-border px-2 py-2 md:hidden">
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surfaceHover"
          onClick={() => setPane('sidebar')}
        >
          ← Back
        </button>
      </div>
      <ThreadHeader
        displayName={peerDisplayName}
        username={peerUsername}
        userId={peerUserId}
      />
      <EncryptedBanner />
      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 py-4 md:px-4"
        onScroll={onScroll}
      >
        {isFetchingNextPage ? (
          <div className="py-2 text-center text-xs text-muted">Loading older…</div>
        ) : null}
        {loading ? <SkeletonThread /> : null}
        {!loading &&
          messages.map((m, idx) => {
            const prev = messages[idx - 1]
            const mine = m.from_user_id === selfId
            const showMeta =
              !prev ||
              prev.from_user_id !== m.from_user_id ||
              new Date(m.created_at).getTime() -
                new Date(prev.created_at).getTime() >
                5 * 60 * 1000
            return (
              <MessageBubble
                key={m.id}
                message={m}
                isMine={Boolean(mine)}
                showMeta={showMeta}
                onRetry={onRetrySend}
              />
            )
          })}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={onSend} />
    </section>
  )
}
