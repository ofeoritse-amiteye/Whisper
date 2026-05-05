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
    <header className="sticky top-0 z-[2] flex items-center justify-between border-b border-white/10 bg-black/25 px-4 py-3 backdrop-blur-2xl">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar displayName={displayName} username={username} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold tracking-tight text-white">
              {displayName}
            </h2>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full border border-black/40 ${
                online ? 'bg-success' : 'bg-zinc-600'
              }`}
              title={online ? 'Online' : 'Offline'}
              aria-hidden
            />
          </div>
          <div className="truncate text-xs text-muted">@{username}</div>
        </div>
      </div>
      <div className="shrink-0 text-[11px] text-muted">
        {!connected || reconnecting ? 'Reconnecting…' : ''}
      </div>
    </header>
  )
}
