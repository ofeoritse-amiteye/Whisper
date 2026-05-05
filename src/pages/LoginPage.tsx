import { Link } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page px-6 py-12">
      <div className="mx-auto mb-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to WhisperBox</p>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted">
        No account?{' '}
        <Link className="text-accent hover:underline" to="/register">
          Register
        </Link>
      </p>
    </div>
  )
}
