'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

const COLORS = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6']

function Confetti() {
  const pieces = Array.from({ length: 44 }, (_, i) => {
    const left = Math.random() * 100
    const delay = Math.random() * 0.25
    const dur = 1.3 + Math.random() * 1.1
    const color = COLORS[i % COLORS.length]
    const rot = Math.random() * 360
    return (
      <span
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}vw`,
          background: color,
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
          transform: `rotate(${rot}deg)`,
        }}
      />
    )
  })
  return <>{pieces}</>
}

// Botón Pagar: confirma, lanza confeti y liquida (Server Action payKid).
export function PayButton({
  message,
  disabled,
}: {
  message: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  const [party, setParty] = useState(false)
  return (
    <>
      {party && <Confetti />}
      <button
        type="submit"
        disabled={pending || disabled}
        aria-busy={pending}
        onClick={(e) => {
          if (!window.confirm(message)) {
            e.preventDefault()
            return
          }
          setParty(true)
          window.setTimeout(() => setParty(false), 2500)
        }}
        className={`tap-bounce rounded-2xl bg-emerald-600 px-4 py-2.5 font-display text-base font-bold text-white shadow-md disabled:opacity-50${pending ? ' opacity-60' : ''}`}
      >
        💸 Pagar
      </button>
    </>
  )
}
