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
      <div className="mx-4 mb-8 mt-6">
        <div className="wb-glass rounded-2xl px-5 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
            💬
          </div>
          <p className="text-sm font-medium text-zinc-200">No chats yet</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Tap <span className="text-zinc-300">+</span> above to reach someone securely.
          </p>
        </div>
      </div>
    )
  }
  return (
    <ul className="space-y-0 py-3">
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
