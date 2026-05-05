import { useAuthStore } from '../../store/authStore'
import { Spinner } from './Spinner'

export function LogoutOverlay() {
  const isLoggingOut = useAuthStore((s) => s.isLoggingOut)
  if (!isLoggingOut) return null
  return (
    <div
      className="fixed inset-0 z-[180] flex flex-col items-center justify-center gap-4 bg-black/55 px-8 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="h-12 w-12 border-[3px] border-white/35 border-t-white" />
      <p className="text-[15px] font-medium tracking-tight text-white">Logging out…</p>
    </div>
  )
}
