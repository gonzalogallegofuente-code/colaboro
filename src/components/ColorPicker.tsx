'use client'

import { useState } from 'react'

const PRESETS = [
  '#2563eb', '#e11d48', '#16a34a', '#ea580c', '#7c3aed',
  '#0d9488', '#db2777', '#d97706', '#0891b2', '#dc2626',
]

// Selector de color: muestras predefinidas + un color libre. Guarda el hex
// en un campo oculto que viaja con el formulario.
export function ColorPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [val, setVal] = useState((defaultValue || '#2563eb').toLowerCase())
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setVal(c)}
            className={`h-7 w-7 rounded-full transition ${val === c ? 'ring-2 ring-gray-800 ring-offset-2' : ''}`}
            style={{ background: c }}
            aria-label={`Color ${c}`}
          />
        ))}
        <label
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-xs"
          title="Otro color"
        >
          🎨
          <input
            type="color"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>
      <input type="hidden" name={name} value={val} />
    </div>
  )
}
