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
    `rounded-full px-3 py-1 text-sm font-medium transition ${
      on ? 'bg-gray-900 text-white' : 'border bg-white text-gray-600'
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
        className={`ml-auto inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-sm text-gray-600 ${
          other ? 'ring-2 ring-gray-900' : ''
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
