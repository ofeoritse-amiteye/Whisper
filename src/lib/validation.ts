/** Trim and length checks only — crypto stays in src/crypto */

export const MAX_USERNAME = 32
export const MIN_USERNAME = 3
export const MAX_DISPLAY = 64
export const MIN_PASSWORD = 8

export function validateUsername(raw: string): string | null {
  const u = raw.trim()
  if (u.length < MIN_USERNAME) return 'Username is too short'
  if (u.length > MAX_USERNAME) return 'Username is too long'
  if (!/^[a-zA-Z0-9_]+$/.test(u)) {
    return 'Username may only contain letters, numbers, and underscores'
  }
  return null
}

export function validateDisplayName(raw: string): string | null {
  const d = raw.trim()
  if (!d.length) return 'Display name is required'
  if (d.length > MAX_DISPLAY) return 'Display name is too long'
  return null
}

export function validatePassword(raw: string): string | null {
  if (raw.length < MIN_PASSWORD) {
    return `Password must be at least ${MIN_PASSWORD} characters`
  }
  return null
}

export function validateMessageText(raw: string): string | null {
  const t = raw.trim()
  if (!t.length) return 'Message cannot be empty'
  if (t.length > 8000) return 'Message is too long'
  return null
}
