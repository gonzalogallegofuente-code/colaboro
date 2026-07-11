'use client'
import { useRef, useState } from 'react'
import { ICON_CATALOG, type IconStyle } from '@/lib/icons'

// Pinta un icono del catálogo en el estilo del hijo reutilizando los <symbol>
// definidos por <IconDefs> (vía <use>), o el emoji si no hay icono / estilo emoji.
function Glyph({
  iconKey,
  emoji,
  style,
  available,
  size = 24,
}: {
  iconKey: string
  emoji: string
  style: IconStyle
  available: Set<string>
  size?: number
}) {
  if (style !== 'emoji' && available.has(iconKey)) {
    const mono = style === 'line' || style === 'fill' || style === 'game'
    return (
      <svg
        width={size}
        height={size}
        fill={mono ? 'currentColor' : undefined}
        style={mono ? { color: '#3f3f55' } : undefined}
      >
        <use href={`#ic-${iconKey}`} />
      </svg>
    )
  }
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{emoji}</span>
}

// Selector de icono para una tarea: rejilla del catálogo (fija icon + iconKey)
// en el estilo del hijo, con opción de escribir un emoji libre.
// Fila: [icono (tocable)] [children: p. ej. el campo del nombre] [Cambiar icono].
// El catálogo queda OCULTO hasta pulsar el icono o el botón; al elegir se cierra
// y, con autoSubmit, guarda el formulario (edición con autoguardado).
export function IconPicker({
  defaultIcon = '⭐',
  defaultKey = null,
  style = 'emoji',
  availableKeys = [],
  autoSubmit = false,
  children,
}: {
  defaultIcon?: string
  defaultKey?: string | null
  style?: IconStyle
  availableKeys?: string[]
  autoSubmit?: boolean
  children?: React.ReactNode
}) {
  const [icon, setIcon] = useState(defaultIcon)
  const [key, setKey] = useState<string | null>(defaultKey)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const available = new Set(availableKeys)

  return (
    <div ref={rootRef}>
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="iconKey" value={key ?? ''} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Cambiar icono"
          className="tap-bounce flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50"
        >
          {key ? <Glyph iconKey={key} emoji={icon} style={style} available={available} size={28} /> : <span className="text-2xl">{icon}</span>}
        </button>
        {children}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="tap-bounce shrink-0 rounded-full bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold leading-tight text-indigo-600"
        >
          {open ? 'Cerrar' : 'Cambiar icono'}
        </button>
      </div>

      {open && (
        <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-2xl border-2 border-indigo-50 p-2">
          {ICON_CATALOG.map((cat) => (
            <div key={cat.label}>
              <div className="px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-3)]">{cat.label}</div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cat.icons.map((ic) => {
                  const on = key === ic.key
                  return (
                    <button
                      type="button"
                      key={ic.key}
                      title={ic.label}
                      onClick={() => {
                        setIcon(ic.emoji)
                        setKey(ic.key)
                        setOpen(false)
                        if (autoSubmit) rootRef.current?.closest('form')?.requestSubmit()
                      }}
                      className={`tap-bounce flex aspect-square items-center justify-center rounded-lg ${
                        on ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-[var(--card)] hover:bg-indigo-50'
                      }`}
                    >
                      <Glyph iconKey={ic.key} emoji={ic.emoji} style={style} available={available} size={22} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
