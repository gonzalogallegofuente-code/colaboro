import { ICON_CATALOG, type IconStyle } from '@/lib/icons'
import { ICON_PATHS } from '@/lib/icon-paths'
import { ICON_OPENMOJI } from '@/lib/icon-openmoji'
import { ICON_GAME } from '@/lib/icon-game'
import { ICON_SHUTTERSTOCK } from '@/lib/icon-shutterstock'

const ALL_KEYS = ICON_CATALOG.flatMap((c) => c.icons.map((i) => i.key))

// Claves que tienen icono en el estilo dado (las demás caen a emoji).
export function keysForStyle(style: IconStyle): string[] {
  if (style === 'line' || style === 'fill') return ALL_KEYS.filter((k) => ICON_PATHS[k])
  if (style === 'openmoji') return ALL_KEYS.filter((k) => ICON_OPENMOJI[k])
  if (style === 'game') return ALL_KEYS.filter((k) => ICON_GAME[k])
  if (style === 'dibujos') return ALL_KEYS.filter((k) => ICON_SHUTTERSTOCK[k])
  return []
}

// Define <symbol> (uno por icono del estilo) UNA sola vez en la página; el
// selector los reutiliza con <use href="#ic-KEY"> sin repetir los datos.
export function IconDefs({ style }: { style: IconStyle }) {
  if (style === 'emoji') return null
  const keys = keysForStyle(style)
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        {keys.map((k) => {
          if (style === 'openmoji')
            return <symbol key={k} id={`ic-${k}`} viewBox="0 0 72 72" dangerouslySetInnerHTML={{ __html: ICON_OPENMOJI[k] }} />
          if (style === 'game')
            return <symbol key={k} id={`ic-${k}`} viewBox="0 0 512 512" dangerouslySetInnerHTML={{ __html: ICON_GAME[k] }} />
          if (style === 'dibujos')
            return (
              <symbol key={k} id={`ic-${k}`} viewBox="0 0 100 100">
                <image href={ICON_SHUTTERSTOCK[k]} width="100" height="100" preserveAspectRatio="xMidYMid meet" />
              </symbol>
            )
          const inner = style === 'fill' ? ICON_PATHS[k].fill : ICON_PATHS[k].line
          return <symbol key={k} id={`ic-${k}`} viewBox="0 0 256 256" dangerouslySetInnerHTML={{ __html: inner }} />
        })}
      </defs>
    </svg>
  )
}
