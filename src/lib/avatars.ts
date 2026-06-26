import { createAvatar } from '@dicebear/core'
import {
  botttsNeutral,
  pixelArt,
  adventurer,
  funEmoji,
  croodles,
  openPeeps,
  bigSmile,
} from '@dicebear/collection'

// Estilos de avatar "personaje" (DiceBear, licencias libres CC0 / CC BY 4.0).
// CC0: bottts, pixel-art, open-peeps. CC BY 4.0: adventurer, fun-emoji, croodles, big-smile.
export const AVATAR_STYLES = [
  { key: 'bottts', label: 'Robots', style: botttsNeutral },
  { key: 'pixel', label: 'Pixel', style: pixelArt },
  { key: 'adventurer', label: 'Aventura', style: adventurer },
  { key: 'fun', label: 'Caras', style: funEmoji },
  { key: 'garabatos', label: 'Garabatos', style: croodles },
  { key: 'peeps', label: 'Personas', style: openPeeps },
  { key: 'smile', label: 'Sonrisas', style: bigSmile },
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BY_KEY: Record<string, any> = Object.fromEntries(AVATAR_STYLES.map((s) => [s.key, s.style]))

// SVG (data URI) listo para usar en <img src>. Reusa el campo avatarUrl del hijo.
export function avatarDataUri(styleKey: string, seed: string): string | null {
  const style = BY_KEY[styleKey]
  if (!style) return null
  return createAvatar(style, {
    seed,
    radius: 50,
    backgroundColor: ['transparent'],
  }).toDataUri()
}
