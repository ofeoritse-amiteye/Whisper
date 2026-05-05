import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/auth/RegisterForm'

export function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page px-6 py-12">
      <div className="mx-auto mb-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold">Create your WhisperBox</h1>
        <p className="mt-2 text-sm text-muted">
          Your keys stay on this device — use a strong password.
        </p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link className="text-accent hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  )
}
