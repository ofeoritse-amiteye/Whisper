import { useChatStore } from '../../store/chatStore'
import { Avatar } from '../ui/Avatar'

export function ThreadHeader({
  displayName,
  username,
  userId,
}: {
  displayName: string
  username: string
  userId: string
}) {
  const online = useChatStore((s) => Boolean(s.onlineUsers[userId]))
  const reconnecting = useChatStore((s) => s.wsReconnecting)
  const connected = useChatStore((s) => s.wsConnected)

  return (
    <header className="flex items-center justify-between border-b border-border bg-thread px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar displayName={displayName} username={username} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{displayName}</h2>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                online ? 'bg-success' : 'bg-placeholder'
              }`}
              title={online ? 'Online' : 'Offline'}
              aria-hidden
            />
          </div>
          <div className="truncate text-xs text-muted">@{username}</div>
        </div>
        <span className="hidden items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted md:inline-flex">
          🔒 Encrypted
        </span>
      </div>
      <div className="text-xs text-muted">
        {!connected || reconnecting ? 'Reconnecting…' : null}
      </div>
    </header>
  )
}
