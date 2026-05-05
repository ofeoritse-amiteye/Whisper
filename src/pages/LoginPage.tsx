import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const setLoggingOut = useAuthStore((s) => s.setLoggingOut)
  useEffect(() => {
    setLoggingOut(false)
  }, [setLoggingOut])

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden bg-page px-5 py-10">
      <div className="relative z-10 w-full max-w-md">
        <div className="wb-glass-strong rounded-[1.75rem] p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-muted">
              End-to-end
            </div>
            <h1 className="text-[1.65rem] font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted">Sign in to WhisperBox your keys stay on-device.</p>
          </div>
          <LoginForm />
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500">
          No account?{' '}
          <Link
            className="text-zinc-200 underline-offset-4 transition-colors hover:text-white hover:underline"
            to="/register"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
