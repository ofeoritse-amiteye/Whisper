import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { searchUsers } from '../../api/users'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'
import type { UserSearchResult } from '../../types/api'
import { ConversationList } from './ConversationList'

export function Sidebar({
  onCompose,
  conversationsLoading,
  onLogout,
}: {
  onCompose: () => void
  conversationsLoading?: boolean
  onLogout?: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const conversations = useChatStore((s) => s.conversations)
  const activeId = useChatStore((s) => s.activeConversationUserId)
  const setActive = useChatStore((s) => s.setActiveConversationUserId)
  const setPane = useChatStore((s) => s.setMobilePane)

  const [q, setQ] = useState('')
  const [remoteHits, setRemoteHits] = useState<UserSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const filteredLocal = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return conversations
    return conversations.filter(
      (c) =>
        c.username.toLowerCase().includes(t) ||
        c.display_name.toLowerCase().includes(t),
    )
  }, [conversations, q])

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      const query = q.trim()
      if (query.length < 2) {
        setRemoteHits([])
        setSearchLoading(false)
        return
      }
      setSearchLoading(true)
      try {
        const hits = await searchUsers(query)
        setRemoteHits(hits)
      } catch {
        setRemoteHits([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => window.clearTimeout(handle)
  }, [q])

  return (
    <aside className="wb-glass-sidebar flex h-full w-full flex-col md:min-w-[320px]">
      {onLogout ? (
        <div className="flex shrink-0 items-center justify-end border-b border-white/10 px-4 py-2.5">
          <button
            type="button"
            className="bg-red-500/80 rounded-lg px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500/90 transition-colors hover:text-white"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      ) : null}
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] text-sm font-semibold tracking-tight text-white backdrop-blur-sm">
            W
          </span>
          <div className="min-w-0">
            <span className="truncate text-base font-semibold tracking-tight">WhisperBox</span>
            <p className="truncate text-[11px] text-muted">End-to-end encrypted</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCompose}
          className="wb-btn-primary flex shrink-0 items-center justify-center rounded-xl text-sm font-light leading-none py-2 px-2"
          aria-label="New conversation"
        >
          New chat +
        </button>
      </header>

      <div className="space-y-3 border-b border-white/10 p-4">
        <div className="wb-glass-inset flex items-center gap-3 rounded-xl px-3 py-2.5">
          {user ? (
            <>
              <Avatar displayName={user.display_name} username={user.username} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{user.display_name}</div>
                <div className="truncate text-[11px] text-muted">@{user.username}</div>
              </div>
            </>
          ) : null}
        </div>
        <input
          type="search"
          placeholder="Search chats & people…"
          className="wb-glass-inset wb-focus w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-placeholder"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {searchLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : null}
        {!q.trim() ? (
          conversationsLoading ? (
            <ul className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <li key={i}>
                  <div className="flex animate-pulse items-center gap-3 rounded-xl border border-transparent px-3 py-3">
                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 max-w-[10rem] rounded-md bg-white/10" />
                      <div className="h-2 max-w-[6rem] rounded-md bg-white/[0.07]" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ConversationList
              items={filteredLocal}
              activeId={activeId}
              onSelect={(id) => {
                setActive(id)
                setPane('thread')
              }}
            />
          )
        ) : (
          <>
            <ConversationList
              items={filteredLocal}
              activeId={activeId}
              onSelect={(id) => {
                setActive(id)
                setPane('thread')
              }}
            />
            {remoteHits.length > 0 ? (
              <div className="border-t border-white/10 p-3">
                <div className="mb-3 px-1 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Directory
                </div>
                <ul className="space-y-1">
                  {remoteHits.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="wb-btn-ghost flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                        onClick={() => {
                          setActive(h.id)
                          setPane('thread')
                        }}
                      >
                        <Avatar displayName={h.display_name} username={h.username} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{h.display_name}</div>
                          <div className="truncate text-[11px] text-muted">@{h.username}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </aside>
  )
}
