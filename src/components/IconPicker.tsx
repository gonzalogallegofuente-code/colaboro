'use client'
import { useState } from 'react'
import { ICON_CATALOG } from '@/lib/icons'
import { ICON_PATHS } from '@/lib/icon-paths'
import type { IconStyle } from '@/lib/icons'

function Glyph({ emoji, iconKey, style, size = 22 }: { emoji: string; iconKey: string; style: IconStyle; size?: number }) {
  const paths = ICON_PATHS[iconKey]
  if (style === 'emoji' || !paths) return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{emoji}</span>
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: style === 'fill' ? paths.fill : paths.line }}
    />
  )
}

// Selector de icono para una tarea: rejilla del catálogo (fija icon + iconKey)
// con la opción de escribir un emoji libre. Muestra los iconos en el estilo
// elegido por el hijo para que se vea cómo quedarán.
export function IconPicker({
  defaultIcon = '⭐',
  defaultKey = null,
  style = 'emoji',
}: {
  defaultIcon?: string
  defaultKey?: string | null
  style?: IconStyle
}) {
  const [icon, setIcon] = useState(defaultIcon)
  const [key, setKey] = useState<string | null>(defaultKey)

  return (
    <div>
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="iconKey" value={key ?? ''} />

      <div className="flex items-center gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[var(--ink)]">
          {key ? <Glyph emoji={icon} iconKey={key} style={style} size={26} /> : <span className="text-2xl">{icon}</span>}
        </span>
        <input
          value={key ? '' : icon}
          onChange={(e) => {
            setIcon(e.target.value || '⭐')
            setKey(null)
          }}
          maxLength={4}
          placeholder="…o tu emoji"
          className="w-24 rounded-xl border-2 border-indigo-100 px-2 py-1.5 text-center text-lg outline-none focus:border-indigo-500"
        />
        <span className="text-[11px] font-semibold text-[var(--ink-3)]">Elige abajo o escribe un emoji</span>
      </div>

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
                    }}
                    className={`tap-bounce flex aspect-square items-center justify-center rounded-lg ${
                      on ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' : 'bg-[var(--card)] text-[var(--ink)] hover:bg-indigo-50'
                    }`}
                  >
                    <Glyph emoji={ic.emoji} iconKey={ic.key} style={style} size={20} />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
