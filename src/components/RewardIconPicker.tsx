'use client'
import { useState } from 'react'
import { REWARD_CATALOG } from '@/lib/reward-icons'

// Selector de icono de recompensa: galería de dibujos (vía <use>, ver
// <RewardIconDefs>) + opción de emoji libre. Fija icon + iconKey.
export function RewardIconPicker({
  defaultIcon = '🎁',
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
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          {key ? (
            <svg width={30} height={30}>
              <use href={`#ric-${key}`} />
            </svg>
          ) : (
            <span className="text-2xl">{icon}</span>
          )}
        </span>
        <input
          value={key ? '' : icon}
          onChange={(e) => {
            setIcon(e.target.value || '🎁')
            setKey(null)
          }}
          maxLength={4}
          placeholder="…o tu emoji"
          className="w-24 rounded-xl border-2 border-indigo-100 px-2 py-1.5 text-center text-lg outline-none focus:border-indigo-500"
        />
        <span className="text-[11px] font-semibold text-[var(--ink-3)]">Elige abajo o escribe un emoji</span>
      </div>

      <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-2xl border-2 border-indigo-50 p-2">
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
    </div>
  )
}
