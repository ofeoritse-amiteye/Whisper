export function EncryptedBanner() {
  return (
    <div className="relative z-[1]  mt-2 text-center text-[11px] leading-relaxed text-muted backdrop-blur-xl">
      <span className="text-zinc-300">🔒 </span>
      Messages are end-to-end encrypted. WhisperBox cannot read them.
    </div>
  )
}
