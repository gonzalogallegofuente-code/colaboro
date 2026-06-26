import { ICON_PATHS } from '@/lib/icon-paths'
import type { IconStyle } from '@/lib/icons'

// Pinta el icono de una tarea según el estilo del hijo: emoji, línea o relleno.
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
