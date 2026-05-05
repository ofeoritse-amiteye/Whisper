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

function extractApiErrorDetail(data: unknown): string | undefined {
  if (data === null || data === undefined || typeof data !== 'object') return undefined
  const detail = (data as { detail?: unknown }).detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const parts: string[] = []
    for (const item of detail) {
      if (typeof item === 'string') parts.push(item)
      else if (item && typeof item === 'object' && 'msg' in item) {
        const msg = (item as { msg?: unknown }).msg
        if (typeof msg === 'string') parts.push(msg)
      }
    }
    return parts.length > 0 ? parts.join(' ') : undefined
  }
  return undefined
}

export function RegisterForm() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [busyStep, setBusyStep] = useState<'idle' | 'crypto' | 'network'>('idle')
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
    setBusyStep('crypto')
    try {
      const { publicKey, privateKey } = await generateKeyPair()
      const salt = generateSalt(16)
      const wrappingKey = await deriveWrappingKey(password, salt)
      const wrappedBuf = await wrapPrivateKey(privateKey, wrappingKey)
      const public_key = await exportPublicKeyBase64(publicKey)
      const wrapped_private_key = bufferToBase64(wrappedBuf)
      const pbkdf2_salt = bufferToBase64(salt)

      setBusyStep('network')
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
      if (isAxiosError(err)) {
        const status = err.response?.status
        const body = err.response?.data
        const detail = extractApiErrorDetail(body)

        if (status === 409) {
          setUsernameError('Username already taken')
          return
        }
        if (status === 400 || status === 422) {
          setFieldError(
            detail ??
              (status === 422
                ? 'Please check your inputs and try again.'
                : 'Registration failed'),
          )
          return
        }
        if (err.response === undefined) {
          setFieldError(
            'Could not reach the server. This often happens when your deployed site is blocked by the API (CORS) or the API is down. Try DevTools → Network on the failed register request.',
          )
          toast.error('Connection failed')
          return
        }
        setFieldError(
          detail ?? `Registration failed (error ${String(status)}). Try again later.`,
        )
        return
      }
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setFieldError(msg)
    } finally {
      setLoading(false)
      setBusyStep('idle')
    }
  }

  return (
    <form className="mx-auto grid gap-5" onSubmit={onSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500" htmlFor="reg-user">
            Username
          </label>
          <input
            id="reg-user"
            autoComplete="username"
            className="wb-glass-inset wb-focus w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-placeholder"
            placeholder="alice_92"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {usernameError ? (
            <p className="mt-2 text-xs text-danger">{usernameError}</p>
          ) : null}
        </div>
        <div className="sm:col-span-1">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500" htmlFor="reg-name">
            Display name
          </label>
          <input
            id="reg-name"
            autoComplete="name"
            className="wb-glass-inset wb-focus w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-placeholder"
            placeholder="Alice"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500" htmlFor="reg-pass">
          Password
        </label>
        <input
          id="reg-pass"
          type="password"
          autoComplete="new-password"
          className="wb-glass-inset wb-focus w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-placeholder"
          placeholder="8+ characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {fieldError ? (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fieldError}
        </p>
      ) : null}
      {loading && busyStep === 'crypto' ? (
        <p className="text-center text-xs leading-relaxed text-muted sm:text-left">
          Creating encryption keys in your browser (RSA + password stretch). This can take a few
          seconds — the server is only contacted after that.
        </p>
      ) : null}
      {loading && busyStep === 'network' ? (
        <p className="text-center text-xs text-muted sm:text-left">Talking to WhisperBox server…</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="wb-btn-primary flex min-h-[3rem] items-center px-2 justify-center gap-2 rounded-xl text-[15px] font-medium text-white sm:justify-self-start"
      >
        {loading ? <Spinner /> : null}
        Create account
      </button>
    </form>
  )
}
