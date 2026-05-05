import { useEffect, useState } from 'react'
import { searchUsers } from '../../api/users'
import { Avatar } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'
import { useChatStore } from '../../store/chatStore'
import type { UserSearchResult } from '../../types/api'

export function NewConversationModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  return <NewConversationModalInner onClose={onClose} />
}

function NewConversationModalInner({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<UserSearchResult[]>([])
  const setActive = useChatStore((s) => s.setActiveConversationUserId)
  const upsert = useChatStore((s) => s.upsertConversation)
  const setPane = useChatStore((s) => s.setMobilePane)

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      const query = q.trim()
      if (query.length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const hits = await searchUsers(query)
        setResults(hits)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => window.clearTimeout(handle)
  }, [q])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-semibold">New conversation</h3>
          <button
            type="button"
            className="text-sm text-muted hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="px-4 py-3">
          <input
            autoFocus
            className="w-full rounded-lg border border-border bg-thread px-3 py-2 text-sm text-white placeholder:text-placeholder outline-none focus:border-accent"
            placeholder="Search people…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="max-h-80 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <ul>
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-surfaceHover"
                    onClick={() => {
                      upsert({
                        user_id: u.id,
                        display_name: u.display_name,
                        username: u.username,
                        last_message_at: new Date().toISOString(),
                      })
                      setActive(u.id)
                      setPane('thread')
                      onClose()
                    }}
                  >
                    <Avatar displayName={u.display_name} username={u.username} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {u.display_name}
                      </div>
                      <div className="truncate text-xs text-muted">@{u.username}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
