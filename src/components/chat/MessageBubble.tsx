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

  const bubbleCls = `${isMine ? 'wb-bubble-sent' : 'wb-bubble-received'} shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]`

  return (
    <div
      className={`flex w-full px-1 ${isMine ? 'justify-end' : 'justify-start'} ${
        showMeta ? 'mt-4' : 'mt-1'
      }`}
    >
      <div
        className={`max-w-[min(540px,88%)] px-4 py-2.5 ${bubbleCls} shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] ${
          sending ? 'opacity-85' : ''
        } ${isMine ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`}
      >
        {message.decryptFailed ? (
          <p className="text-sm text-red-300/95">🔒 Unable to decrypt this message</p>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-zinc-100">
            {message.plainText ?? ''}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/65">
          {sending ? <Spinner className="h-3.5 w-3.5 border-zinc-500 border-t-white" /> : null}
          <time className="tabular-nums text-zinc-500">{formatTime(message.created_at)}</time>
          {failed && onRetry && message.plainText ? (
            <button
              type="button"
              className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-medium text-zinc-200 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
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
