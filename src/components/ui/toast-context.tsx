import { createContext } from 'react'

export type ToastVariant = 'error' | 'success'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

export interface ToastCtx {
  items: ToastItem[]
  push: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastCtx | null>(null)
