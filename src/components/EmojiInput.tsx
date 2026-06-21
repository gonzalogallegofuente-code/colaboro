'use client'

import { useState } from 'react'

// Campo de texto para un emoji + chips de sugerencias que lo rellenan.
export function EmojiInput({
  name,
  defaultValue,
  suggestions,
}: {
  name: string
  defaultValue?: string
  suggestions: string[]
}) {
  const [val, setVal] = useState(defaultValue ?? '')
  return (
    <div>
      <input
        name={name}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        maxLength={4}
        className="w-16 rounded-xl border-2 border-indigo-100 px-2 py-1.5 text-center text-2xl outline-none focus:border-indigo-500"
        aria-label="Icono"
      />
      <div className="mt-1 flex flex-wrap gap-1">
        {suggestions.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setVal(s)}
            className={`rounded-lg px-1.5 py-0.5 text-xl transition ${
              val === s ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-gray-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
