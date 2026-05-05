import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastVariant } from './toast-context'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<
    { id: string; message: string; variant: ToastVariant }[]
  >([])

  const push = useCallback((message: string, variant: ToastVariant = 'error') => {
    const id = crypto.randomUUID()
    setItems((prev) => [...prev, { id, message, variant }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(
    () => ({ items, push, dismiss }),
    [dismiss, items, push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-5 z-[100] flex w-full max-w-sm flex-col gap-3 px-0 sm:right-8">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-2xl ${
              t.variant === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/50 text-emerald-100'
                : 'border-red-500/35 bg-red-950/55 text-red-100'
            }`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
