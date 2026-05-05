import type { ConversationSummary } from '../../types/api'
import { ConversationItem } from './ConversationItem'

export function ConversationList({
  items,
  activeId,
  onSelect,
}: {
  items: ConversationSummary[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  if (!items.length) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted">
        No conversations yet. Tap + to start one.
      </div>
    )
  }
  return (
    <ul className="divide-y divide-border/60">
      {items.map((c) => (
        <ConversationItem
          key={c.user_id}
          conversation={c}
          active={c.user_id === activeId}
          onSelect={() => onSelect(c.user_id)}
        />
      ))}
    </ul>
  )
}
