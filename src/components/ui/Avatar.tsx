const PALETTE = [
  'bg-red-700/95',
  'bg-orange-600/95',
  'bg-amber-600/95',
  'bg-emerald-700/95',
  'bg-teal-700/95',
  'bg-blue-700/95',
  'bg-violet-600/95',
  'bg-fuchsia-700/95',
]

function hashUsername(username: string): number {
  let h = 0
  for (let i = 0; i < username.length; i++) {
    h = (h * 31 + username.charCodeAt(i)) >>> 0
  }
  return h
}

function initials(name: string): string {
  const t = name.trim()
  if (!t) return '?'
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (
      parts[0]!.slice(0, 1).toUpperCase() + parts[1]!.slice(0, 1).toUpperCase()
    )
  }
  return t.slice(0, 2).toUpperCase()
}

export type AvatarSize = 'sm' | 'md' | 'lg'

const sizeClass: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
}

export function Avatar({
  displayName,
  username,
  size = 'md',
}: {
  displayName: string
  username: string
  size?: AvatarSize
}) {
  const bg = PALETTE[hashUsername(username) % PALETTE.length]
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-clip-padding font-semibold leading-none tracking-tighter text-white shadow-inner ${bg} ${sizeClass[size]}`}
      aria-hidden
    >
      {initials(displayName)}
    </div>
  )
}
