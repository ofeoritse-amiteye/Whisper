import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAccount } from '../../api/auth'
import { base64ToBuffer } from '../../crypto/utils'
import { deriveWrappingKey } from '../../crypto/pbkdf2'
import { unwrapPrivateKey, importOwnPublicKeyFromSpkiBase64 } from '../../crypto/keys'
import { useAuthStore } from '../../store/authStore'
import { Spinner } from '../ui/Spinner'
import { useToast } from '../ui/useToast'

export function LoginForm() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const u = username.trim()
    if (!u || !password) {
      setError('Please enter username and password')
      return
    }
    setLoading(true)
    try {
      const data = await loginAccount({ username: u, password })
      const salt = new Uint8Array(base64ToBuffer(data.user.pbkdf2_salt))
      const wrappingKey = await deriveWrappingKey(password, salt)
      const privateKey = await unwrapPrivateKey(
        data.user.wrapped_private_key,
        wrappingKey,
      )
      const publicKey = await importOwnPublicKeyFromSpkiBase64(data.user.public_key)
      setSession({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        privateKey,
        publicKey,
      })
      navigate('/')
    } catch {
      toast.error('Login failed')
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mx-auto flex max-w-sm flex-col gap-4" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="login-user">
          Username
        </label>
        <input
          id="login-user"
          autoComplete="username"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none focus:border-accent"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="login-pass">
          Password
        </label>
        <input
          id="login-pass"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none focus:border-accent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? <Spinner /> : null}
        Sign in
      </button>
    </form>
  )
}
