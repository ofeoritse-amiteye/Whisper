import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-page px-6 py-16">
          <div className="wb-glass-strong max-w-md rounded-[1.5rem] px-8 py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/35 bg-red-500/15 text-lg">
              !
            </div>
            <p className="text-sm font-medium text-red-100">Something went wrong</p>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-muted">
              Refresh this page — your session stays in memory only anyway.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
