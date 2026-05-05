import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAccount } from '../../api/auth'
import { base64ToBuffer } from '../../crypto/utils'
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
      const privateKey = await unwrapPrivateKey(
        data.user.wrapped_private_key,
        password,
        salt,
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
    <form className="mx-auto flex flex-col gap-5" onSubmit={onSubmit}>
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500" htmlFor="login-user">
          Username
        </label>
        <input
          id="login-user"
          autoComplete="username"
          className="wb-glass-inset wb-focus w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-placeholder"
          placeholder="your_username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500" htmlFor="login-pass">
          Password
        </label>
        <input
          id="login-pass"
          type="password"
          autoComplete="current-password"
          className="wb-glass-inset wb-focus w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-placeholder"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="wb-btn-primary flex min-h-[3rem] items-center justify-center gap-2 rounded-xl text-[15px] font-medium text-white"
      >
        {loading ? <Spinner className="h-5 w-5 border-t-[currentColor]" /> : null}
        Sign in
      </button>
    </form>
  )
}
