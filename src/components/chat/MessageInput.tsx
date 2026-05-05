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
      className="border-t border-white/10 bg-black/30 px-4 py-4 backdrop-blur-2xl"
      onSubmit={onSubmit}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <textarea
          className="wb-glass-inset wb-focus min-h-[48px] flex-1 resize-none rounded-[1rem] px-4 py-3 text-left text-[15px] leading-normal text-white placeholder:text-placeholder"
          placeholder="Message… Shift+Enter for newline"
          rows={1}
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
          className="wb-btn-primary shrink-0 rounded-xl px-6 py-3 text-[15px] font-medium text-white disabled:pointer-events-none"
        >
          Send
        </button>
      </div>
    </form>
  )
}
