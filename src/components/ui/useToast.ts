import { useContext } from 'react'
import { ToastContext } from './toast-context'

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      error: () => {
        /* no provider */
      },
      success: () => {
        /* no provider */
      },
    }
  }
  return {
    error: (msg: string) => ctx.push(msg, 'error'),
    success: (msg: string) => ctx.push(msg, 'success'),
  }
}
