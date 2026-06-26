import { ICON_PATHS } from '@/lib/icon-paths'
import { ICON_OPENMOJI } from '@/lib/icon-openmoji'
import { ICON_GAME } from '@/lib/icon-game'
import { ICON_SHUTTERSTOCK } from '@/lib/icon-shutterstock'
import type { IconStyle } from '@/lib/icons'

// Pinta el icono de una tarea según el estilo del hijo: emoji, línea, relleno o pegatina.
export function TaskGlyph({
  iconKey,
  emoji,
  style,
  size = 24,
  color,
  className,
}: {
  iconKey?: string | null
  emoji: string
  style: IconStyle
  size?: number
  color?: string
  className?: string
}) {
  // Pegatina (OpenMoji): color propio, viewBox 0 0 72 72.
  if (style === 'openmoji') {
    const om = iconKey ? ICON_OPENMOJI[iconKey] : undefined
    if (om) {
      return (
        <svg
          viewBox="0 0 72 72"
          width={size}
          height={size}
          className={className}
          dangerouslySetInnerHTML={{ __html: om }}
        />
      )
    }
    return (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
        {emoji}
      </span>
    )
  }

  // Dibujos (set "Kids Chores Icons"): imagen PNG a todo color.
  if (style === 'dibujos') {
    const im = iconKey ? ICON_SHUTTERSTOCK[iconKey] : undefined
    if (im) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={im} alt="" width={size} height={size} className={className} style={{ objectFit: 'contain', display: 'block' }} />
      )
    }
    return (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
        {emoji}
      </span>
    )
  }

  // Gamer/fantasía (game-icons): silueta monocroma, viewBox 0 0 512 512.
  if (style === 'game') {
    const g = iconKey ? ICON_GAME[iconKey] : undefined
    if (g) {
      return (
        <svg
          viewBox="0 0 512 512"
          width={size}
          height={size}
          fill="currentColor"
          className={className}
          style={color ? { color } : undefined}
          dangerouslySetInnerHTML={{ __html: g }}
        />
      )
    }
    return (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
        {emoji}
      </span>
    )
  }

  const paths = iconKey ? ICON_PATHS[iconKey] : undefined
  if (style === 'emoji' || !paths) {
    return (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
        {emoji}
      </span>
    )
  }
  const inner = style === 'fill' ? paths.fill : paths.line
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={color ? { color } : undefined}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}
