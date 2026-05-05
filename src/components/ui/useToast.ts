import { useContext } from 'react'
import { ToastContext } from './toast-context'

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      error: () => undefined,
      success: () => undefined,
    }
  }
  return {
    error: (msg: string) => ctx.push(msg, 'error'),
    success: (msg: string) => ctx.push(msg, 'success'),
  }
}
