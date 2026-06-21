// Muestra el avatar de un hijo: la foto si la tiene, si no su emoji.
export function Avatar({
  emoji,
  avatarUrl,
  name,
  size = 48,
  className = '',
}: {
  emoji: string
  avatarUrl?: string | null
  name?: string
  size?: number
  className?: string
}) {
  const box = { width: size, height: size }
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt={name ?? ''}
        className={`rounded-full object-cover ${className}`}
        style={box}
      />
    )
  }
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={box}>
      <span style={{ fontSize: Math.round(size * 0.82), lineHeight: 1 }}>{emoji}</span>
    </span>
  )
}
