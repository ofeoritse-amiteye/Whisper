import type { ChatMessageView } from '../../hooks/useMessages'
import { Spinner } from '../ui/Spinner'

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({
  message,
  isMine,
  showMeta,
  onRetry,
}: {
  message: ChatMessageView
  isMine: boolean
  showMeta: boolean
  onRetry?: (plain: string, tempId: string) => void
}) {
  const sending = message.sendState === 'sending'
  const failed = message.sendState === 'error'

  return (
    <div
      className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} ${
        showMeta ? 'mt-3' : 'mt-1'
      }`}
    >
      <div
        className={`max-w-[min(560px,85%)] px-3 py-2 ${
          isMine
            ? 'bg-accent rounded-2xl rounded-tr-sm'
            : 'bg-surface rounded-2xl rounded-tl-sm'
        } ${sending ? 'opacity-80' : ''}`}
      >
        {message.decryptFailed ? (
          <p className="text-sm text-danger">🔒 Unable to decrypt this message</p>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm text-white">
            {message.plainText ?? ''}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/70">
          {sending ? <Spinner className="h-3 w-3 border-t-white" /> : null}
          <time className="text-muted">{formatTime(message.created_at)}</time>
          {failed && onRetry && message.plainText ? (
            <button
              type="button"
              className="text-xs text-white underline"
              onClick={() => onRetry(message.plainText!, message.id)}
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
