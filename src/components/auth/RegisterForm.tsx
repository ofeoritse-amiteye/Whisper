import { isAxiosError } from 'axios'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerAccount } from '../../api/auth'
import { bufferToBase64, generateSalt } from '../../crypto/utils'
import { deriveWrappingKey } from '../../crypto/pbkdf2'
import {
  exportPublicKeyBase64,
  generateKeyPair,
  importOwnPublicKeyFromSpkiBase64,
  wrapPrivateKey,
} from '../../crypto/keys'
import { useAuthStore } from '../../store/authStore'
import {
  validateDisplayName,
  validatePassword,
  validateUsername,
} from '../../lib/validation'
import { Spinner } from '../ui/Spinner'
import { useToast } from '../ui/useToast'

export function RegisterForm() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setUsernameError(null)
    setFieldError(null)

    const u = validateUsername(username)
    if (u) {
      setFieldError(u)
      return
    }
    const d = validateDisplayName(displayName)
    if (d) {
      setFieldError(d)
      return
    }
    const p = validatePassword(password)
    if (p) {
      setFieldError(p)
      return
    }

    setLoading(true)
    try {
      const { publicKey, privateKey } = await generateKeyPair()
      const salt = generateSalt(16)
      const wrappingKey = await deriveWrappingKey(password, salt)
      const wrappedBuf = await wrapPrivateKey(privateKey, wrappingKey)
      const public_key = await exportPublicKeyBase64(publicKey)
      const wrapped_private_key = bufferToBase64(wrappedBuf)
      const pbkdf2_salt = bufferToBase64(salt)

      const data = await registerAccount({
        username: username.trim(),
        display_name: displayName.trim(),
        password,
        public_key,
        wrapped_private_key,
        pbkdf2_salt,
      })

      const pubKeyForStore = await importOwnPublicKeyFromSpkiBase64(
        data.user.public_key,
      )

      setSession({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        privateKey,
        publicKey: pubKeyForStore,
      })
      navigate('/')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setUsernameError('Username already taken')
        return
      }
      if (isAxiosError(err) && err.response?.status === 400) {
        const detail = err.response?.data as { detail?: string }
        setFieldError(detail?.detail ?? 'Registration failed')
        return
      }
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mx-auto flex max-w-sm flex-col gap-4" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="reg-user">
          Username
        </label>
        <input
          id="reg-user"
          autoComplete="username"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none focus:border-accent"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {usernameError ? (
          <p className="mt-1 text-sm text-danger">{usernameError}</p>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="reg-name">
          Display name
        </label>
        <input
          id="reg-name"
          autoComplete="name"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none focus:border-accent"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="reg-pass">
          Password
        </label>
        <input
          id="reg-pass"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-white outline-none focus:border-accent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {fieldError ? <p className="text-sm text-danger">{fieldError}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? <Spinner /> : null}
        Create account
      </button>
    </form>
  )
}
