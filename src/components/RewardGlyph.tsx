import { ICON_REWARDS } from '@/lib/icon-rewards'
import { edadRewardSrc, isEdad } from '@/lib/edad-icons'

// Icono de una recompensa. Con `edad` (sistema actual) se asigna solo según
// clave/nombre; sin ella, el dibujo del set clásico o el emoji (legado).
export function RewardGlyph({
  iconKey,
  emoji,
  edad,
  name,
  size = 32,
  className,
}: {
  iconKey?: string | null
  emoji: string
  edad?: string | null
  name?: string | null
  size?: number
  className?: string
}) {
  if (isEdad(edad)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={edadRewardSrc(edad, { iconKey, name })}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
      />
    )
  }
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
