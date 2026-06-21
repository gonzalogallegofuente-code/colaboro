'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

// Botón "+" grande que, al pulsar, lanza una moneda que sube (premio visual)
// y envía el formulario (Server Action markTask).
export function CoinButton({ color, label }: { color: string; label: string }) {
  const { pending } = useFormStatus()
  const [coins, setCoins] = useState<number[]>([])
  const idRef = useRef(0)
  return (
    <span className="relative inline-flex">
      {coins.map((id) => (
        <span
          key={id}
          className="coin-fly"
          onAnimationEnd={() => setCoins((c) => c.filter((x) => x !== id))}
        >
          🪙
        </span>
      ))}
      <button
        type="submit"
        disabled={pending}
        onClick={() => setCoins((c) => [...c, (idRef.current += 1)])}
        aria-label={label}
        className="tap-bounce flex h-14 w-14 items-center justify-center rounded-full text-4xl font-bold leading-none text-white shadow-lg ring-4 ring-white/70 disabled:opacity-60"
        style={{ background: color }}
      >
        <span className="-mt-1">+</span>
      </button>
    </span>
  )
}
