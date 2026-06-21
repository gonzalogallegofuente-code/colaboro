'use client'

import { useRouter } from 'next/navigation'

// Selector del día al que se imputan las tareas: Hoy / Ayer / otro día.
export function DateNav({
  kidId,
  selectedDate,
  today,
  yesterday,
}: {
  kidId: number
  selectedDate: string
  today: string
  yesterday: string
}) {
  const router = useRouter()
  const go = (d: string) => router.replace(`/?kid=${kidId}&d=${d}`)
  const pill = (on: boolean) =>
    `tap-bounce rounded-full px-4 py-1.5 text-sm font-display font-semibold transition ${
      on ? 'bg-indigo-600 text-white shadow-md' : 'bg-[var(--card)] text-[var(--ink-2)]'
    }`
  const other = selectedDate !== today && selectedDate !== yesterday
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => go(today)} className={pill(selectedDate === today)}>
        Hoy
      </button>
      <button onClick={() => go(yesterday)} className={pill(selectedDate === yesterday)}>
        Ayer
      </button>
      <label
        className={`ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--card)] px-3 py-1.5 text-sm font-semibold text-[var(--ink-2)] ${
          other ? 'ring-2 ring-indigo-500' : ''
        }`}
      >
        <span aria-hidden>📅</span>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="bg-transparent outline-none"
        />
      </label>
    </div>
  )
}
