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
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[95vw] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border border-border px-3 py-2 text-sm shadow-lg ${
              t.variant === 'success'
                ? 'bg-page text-success border-success/40'
                : 'bg-page text-danger border-danger/40'
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
