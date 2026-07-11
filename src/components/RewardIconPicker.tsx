'use client'
import { useState } from 'react'
import { REWARD_CATALOG } from '@/lib/reward-icons'

// Selector de icono de recompensa: galería de dibujos (vía <use>, ver
// <RewardIconDefs>) + opción de emoji libre. Fija icon + iconKey.
export function RewardIconPicker({
  defaultIcon = '🎁',
  defaultKey = null,
  children,
}: {
  defaultIcon?: string
  defaultKey?: string | null
  children?: React.ReactNode
}) {
  const [icon, setIcon] = useState(defaultIcon)
  const [key, setKey] = useState<string | null>(defaultKey)
  const [open, setOpen] = useState(false)

  return (
    <div>
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="iconKey" value={key ?? ''} />

      {/* Línea: icono (tocable) + nombre (children) + Cambiar icono */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Cambiar icono"
          className="tap-bounce flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50"
        >
          {key ? (
            <svg width={30} height={30}>
              <use href={`#ric-${key}`} />
            </svg>
          ) : (
            <span className="text-2xl">{icon}</span>
          )}
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
          <label className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Tu emoji:</span>
            <input
              value={key ? '' : icon}
              onChange={(e) => {
                setIcon(e.target.value || '🎁')
                setKey(null)
              }}
              maxLength={4}
              placeholder="🎁"
              className="w-20 rounded-xl border-2 border-indigo-100 px-2 py-1 text-center text-lg outline-none focus:border-indigo-500"
            />
          </label>
          {REWARD_CATALOG.map((cat) => (
            <div key={cat.label}>
              <div className="px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-3)]">{cat.label}</div>
              <div className="mt-1 grid grid-cols-6 gap-1">
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
                      }}
                      className={`tap-bounce flex aspect-square items-center justify-center rounded-lg ${
                        on ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-[var(--card)] hover:bg-indigo-50'
                      }`}
                    >
                      <svg width={28} height={28}>
                        <use href={`#ric-${ic.key}`} />
                      </svg>
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
