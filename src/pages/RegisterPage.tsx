import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/auth/RegisterForm'
import { useAuthStore } from '../store/authStore'

export function RegisterPage() {
  const setLoggingOut = useAuthStore((s) => s.setLoggingOut)
  useEffect(() => {
    setLoggingOut(false)
  }, [setLoggingOut])

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden bg-page px-5 py-10">
      <div className="relative z-10 w-full max-w-xl">
        <div className="wb-glass-strong rounded-[1.75rem] p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-muted">
              End-to-end
            </div>
            <h1 className="text-[1.65rem] font-semibold tracking-tight text-white">
              Create WhisperBox
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
              Keys are created in your browser. Use a strong password.
            </p>
          </div>
          <RegisterForm />
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link
            className="text-zinc-200 underline-offset-4 transition-colors hover:text-white hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
