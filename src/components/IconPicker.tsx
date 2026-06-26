'use client'
import { useState } from 'react'
import { ICON_CATALOG } from '@/lib/icons'

// Selector de icono para una tarea: rejilla del catálogo (fija icon + iconKey)
// con la opción de escribir un emoji libre. Muestra los emojis (el estilo real
// —línea/relleno/pegatina— se ve en el tablero, renderizado en el servidor; así
// no cargamos los mapas de SVG en el navegador).
export function IconPicker({
  defaultIcon = '⭐',
  defaultKey = null,
}: {
  defaultIcon?: string
  defaultKey?: string | null
}) {
  const [icon, setIcon] = useState(defaultIcon)
  const [key, setKey] = useState<string | null>(defaultKey)

  return (
    <div>
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="iconKey" value={key ?? ''} />

      <div className="flex items-center gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
          {icon}
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
                    className={`tap-bounce flex aspect-square items-center justify-center rounded-lg text-xl ${
                      on ? 'bg-indigo-600 ring-2 ring-indigo-300' : 'bg-[var(--card)] hover:bg-indigo-50'
                    }`}
                  >
                    {ic.emoji}
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
