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
}: {
  onCompose: () => void
  conversationsLoading?: boolean
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
    <aside className="flex h-full w-full flex-col border-r border-border bg-sidebar md:w-80 md:min-w-[320px]">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">WhisperBox</span>
          <span aria-hidden>🔐</span>
        </div>
        <button
          type="button"
          onClick={onCompose}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          aria-label="New conversation"
        >
          +
        </button>
      </header>
      <div className="border-b border-border px-4 py-3">
        <div className="mb-3 flex items-center gap-2">
          {user ? (
            <>
              <Avatar displayName={user.display_name} username={user.username} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.display_name}</div>
                <div className="truncate text-xs text-muted">@{user.username}</div>
              </div>
            </>
          ) : null}
        </div>
        <input
          type="search"
          placeholder="Search conversations or people…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder:text-placeholder outline-none focus:border-accent"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {searchLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : null}
        {!q.trim() ? (
          conversationsLoading ? (
            <ul className="px-2 py-2">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="px-2 py-3">
                  <div className="flex animate-pulse items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-surfaceHover" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 rounded bg-surfaceHover" />
                      <div className="h-2 w-24 rounded bg-surfaceHover" />
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
              <div className="border-t border-border px-2 py-2">
                <div className="px-2 pb-2 text-xs uppercase text-placeholder">
                  People
                </div>
                <ul>
                  {remoteHits.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-surfaceHover"
                        onClick={() => {
                          setActive(h.id)
                          setPane('thread')
                        }}
                      >
                        <Avatar displayName={h.display_name} username={h.username} />
                        <div className="min-w-0">
                          <div className="truncate text-sm">{h.display_name}</div>
                          <div className="truncate text-xs text-muted">
                            @{h.username}
                          </div>
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
