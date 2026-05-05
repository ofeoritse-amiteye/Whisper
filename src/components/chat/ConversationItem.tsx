import type { ConversationSummary } from '../../types/api'
import { Avatar } from '../ui/Avatar'

export function ConversationItem({
  conversation: c,
  active,
  onSelect,
}: {
  conversation: ConversationSummary
  active: boolean
  onSelect: () => void
}) {
  return (
    <li className="px-2 pb-1">
      <button
        type="button"
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
          active
            ? 'border border-violet-400/35 bg-accent/18 backdrop-blur-md shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]'
            : 'wb-btn-ghost border border-transparent hover:border-white/[0.08]'
        }`}
        onClick={onSelect}
      >
        <Avatar displayName={c.display_name} username={c.username} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium text-white">{c.display_name}</span>
            <span className="shrink-0 text-[11px] text-muted">
              {formatTime(c.last_message_at)}
            </span>
          </div>
          <div className="truncate text-[11px] text-muted">@{c.username}</div>
        </div>
      </button>
    </li>
  )
}

function formatTime(iso: string | null): string {
  if (iso === null || iso === '') return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
