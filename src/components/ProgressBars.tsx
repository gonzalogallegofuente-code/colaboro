// Barras de progreso "con precisión" (elegidas por el usuario, 2026-07-26):
// - SegmentBar: CASILLAS, una por tarea — para el objetivo semanal y el
//   familiar (números pequeños; se cuenta a ojo cuánto falta). Con totales
//   grandes (>30) cae a barra continua con marcas cada 5 para no hacer migas.
// - TickBar: barra continua con MARCAS finas/gruesas — para la meta de ahorro
//   (dinero/puntos, escala a cualquier importe con pasos "bonitos").

const SEG_MAX = 30

export function SegmentBar({
  done,
  total,
  tone,
  height = 16,
}: {
  done: number
  total: number
  tone: 'verde' | 'azul'
  height?: number
}) {
  const on =
    tone === 'verde'
      ? 'linear-gradient(180deg,#34d399,#10b981)'
      : 'linear-gradient(180deg,#818cf8,#6366f1)'
  if (total <= 0) return null

  if (total > SEG_MAX) {
    // Demasiadas casillas: barra continua con una marca cada 5 tareas.
    const pct = Math.min(100, (done / total) * 100)
    const fillBg =
      tone === 'verde'
        ? 'linear-gradient(90deg,#6ee7b7,#10b981)'
        : 'linear-gradient(90deg,#7dd3fc,#6366f1)'
    const step = `calc(100% / ${Math.ceil(total / 5)})`
    return (
      <div className="relative mt-2 overflow-hidden rounded-full bg-gray-200" style={{ height }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fillBg }} />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `repeating-linear-gradient(to right, transparent 0, transparent calc(${step} - 2px), var(--card, #fff) calc(${step} - 2px), var(--card, #fff) ${step})`,
          }}
        />
      </div>
    )
  }

  return (
    <div className="mt-2 flex" style={{ gap: total > 20 ? 2 : 3 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-full flex-1"
          style={{
            height,
            background: i < done ? on : '#e5e7eb',
            borderRadius:
              i === 0 ? '99px 5px 5px 99px' : i === total - 1 ? '5px 99px 99px 5px' : 5,
          }}
        />
      ))}
    </div>
  )
}

// Paso "bonito" para las marcas finas (≤ ~30 marcas) y grueso = 5× fino.
function pasoBonito(totalUnits: number): number {
  for (const p of [1, 2, 5, 10, 20, 50, 100]) {
    if (totalUnits / p <= 30) return p
  }
  return 200
}

export function TickBar({
  doneCents,
  totalCents,
  height = 12,
}: {
  doneCents: number
  totalCents: number
  height?: number
}) {
  if (totalCents <= 0) return null
  const pct = Math.min(100, (doneCents / totalCents) * 100)
  const units = totalCents / 100 // euros o puntos enteros
  const fino = pasoBonito(units)
  const nFino = units / fino
  const nGrueso = units / (fino * 5)
  const stepF = `calc(100% / ${nFino})`
  const stepG = `calc(100% / ${nGrueso})`
  const capas = [
    `repeating-linear-gradient(to right, transparent 0, transparent calc(${stepF} - 1px), rgba(255,255,255,.55) calc(${stepF} - 1px), rgba(255,255,255,.55) ${stepF})`,
  ]
  if (nGrueso >= 2) {
    capas.push(
      `repeating-linear-gradient(to right, transparent 0, transparent calc(${stepG} - 2px), var(--card, #fff) calc(${stepG} - 2px), var(--card, #fff) ${stepG})`,
    )
  }
  return (
    <div className="relative mt-2 overflow-hidden rounded-full bg-gray-200" style={{ height }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#fcd34d,#f59e0b)' }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: capas.join(',') }} />
    </div>
  )
}
