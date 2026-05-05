import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useState,
} from 'react'
import { validateMessageText } from '../../lib/validation'

export function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void | Promise<void>
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  async function submit() {
    const err = validateMessageText(value)
    if (err) return
    const text = value.trim()
    await onSend(text)
    setValue('')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void submit()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  const empty = !value.trim()
  const err = validateMessageText(value)

  return (
    <form
      className="border-t border-border bg-thread px-4 py-3"
      onSubmit={onSubmit}
    >
      <div className="flex items-end gap-2">
        <textarea
          className="min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white placeholder:text-placeholder outline-none focus:border-accent"
          placeholder="Message… (Shift+Enter for newline)"
          rows={2}
          value={value}
          disabled={disabled}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setValue(e.target.value)
          }
          onKeyDown={onKeyDown}
        />
        <button
          type="submit"
          disabled={disabled || empty || Boolean(err)}
          className="mb-0.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </form>
  )
}
