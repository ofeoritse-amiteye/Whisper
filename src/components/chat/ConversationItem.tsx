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
    <li>
      <button
        type="button"
        className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surfaceHover ${
          active ? 'bg-surface' : ''
        }`}
        onClick={onSelect}
      >
        <Avatar displayName={c.display_name} username={c.username} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{c.display_name}</span>
            <span className="shrink-0 text-xs text-muted">
              {formatTime(c.last_message_at)}
            </span>
          </div>
          <div className="truncate text-xs text-muted">@{c.username}</div>
        </div>
      </button>
    </li>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
