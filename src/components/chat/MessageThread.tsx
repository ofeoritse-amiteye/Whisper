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
    <div className="flex flex-col gap-2 px-3 py-4 md:px-5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`h-11 w-[68%] max-w-xs animate-pulse rounded-2xl ${
              i % 2 === 0 ? 'bg-white/[0.08]' : 'bg-accent/20'
            } backdrop-blur-sm`}
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
      <div className="flex flex-1 items-center justify-center bg-page p-6">
        <div className="wb-glass max-w-sm rounded-[1.5rem] px-8 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-2xl">
            ◇
          </div>
          <p className="text-sm font-medium text-zinc-200">Pick a conversation</p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted">
            Choose someone from the list — every message stays encrypted until it reaches them.
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-page">
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-2 py-2 backdrop-blur-xl md:hidden">
        <button
          type="button"
          className="wb-btn-ghost rounded-xl px-3 py-2 text-xs font-medium text-zinc-300"
          onClick={() => setPane('sidebar')}
        >
          ← Chats
        </button>
      </div>
      <ThreadHeader
        displayName={peerDisplayName}
        username={peerUsername}
        userId={peerUserId}
      />
      <EncryptedBanner />
      <div
        className="relative min-h-0 flex-1 overflow-y-auto px-2 py-4 md:px-5"
        onScroll={onScroll}
      >
        {isFetchingNextPage ? (
          <div className="sticky top-0 z-[1] py-3 text-center text-[11px] text-muted backdrop-blur-sm">
            Loading older messages…
          </div>
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
