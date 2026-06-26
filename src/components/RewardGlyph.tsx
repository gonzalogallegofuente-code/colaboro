import { ICON_REWARDS } from '@/lib/icon-rewards'

// Icono de una recompensa: el dibujo si tiene iconKey, si no el emoji.
export function RewardGlyph({
  iconKey,
  emoji,
  size = 32,
  className,
}: {
  iconKey?: string | null
  emoji: string
  size?: number
  className?: string
}) {
  const im = iconKey ? ICON_REWARDS[iconKey] : undefined
  if (im) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={im}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
      />
    )
  }
  return (
    <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }}>
      {emoji}
    </span>
  )
}
