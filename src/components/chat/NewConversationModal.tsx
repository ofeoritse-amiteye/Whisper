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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-5 backdrop-blur-md">
      <div
        className="wb-glass-strong relative w-full max-w-lg overflow-hidden rounded-[1.5rem]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">New conversation</h3>
          <button
            type="button"
            className="wb-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="border-b border-white/10 px-5 py-4">
          <input
            autoFocus
            className="wb-glass-inset wb-focus w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-placeholder"
            placeholder="Search people by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-14">
              <Spinner />
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="wb-btn-ghost flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
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
                      <div className="truncate text-sm font-medium text-white">{u.display_name}</div>
                      <div className="truncate text-[11px] text-muted">@{u.username}</div>
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
