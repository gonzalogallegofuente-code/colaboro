import { getHistory } from '@/lib/data'
import { formatRange, todayYmd, weekRange } from '@/lib/week'
import { euros } from '@/lib/money'
import { Nav } from '@/components/Nav'

export const dynamic = 'force-dynamic'

export default async function HistoricoPage() {
  const { kids, weeks, payouts } = await getHistory()
  const currentStart = weekRange(todayYmd()).start

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="historico" />

      <h1 className="px-4 pt-2 text-lg font-bold text-gray-800">Histórico semanal</h1>
      <p className="px-4 text-xs text-gray-400">Las semanas van de sábado a viernes.</p>

      <div className="mx-3 mt-3 space-y-2">
        {weeks.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
            Aún no hay nada apuntado.
          </div>
        )}
        {weeks.map((w) => {
          const isCurrent = w.start === currentStart
          return (
            <div key={w.start} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {formatRange(w.start, w.end)}
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    en curso
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {kids.map((k) => {
                  const cell = w.perKid[k.id]
                  return (
                    <div key={k.id} className="rounded-xl bg-surface px-3 py-2">
                      <div className="text-xs font-medium" style={{ color: k.color }}>
                        {k.name}
                      </div>
                      <div className="text-base font-bold text-gray-800">
                        {euros(cell?.cents ?? 0)}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {cell?.count ?? 0} {cell?.count === 1 ? 'tarea' : 'tareas'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagos realizados */}
      <h2 className="px-4 pt-6 text-lg font-bold text-gray-800">Pagos</h2>
      <div className="mx-3 mt-2 space-y-2">
        {payouts.length === 0 && (
          <div className="rounded-2xl bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
            Todavía no se ha liquidado ningún pago.
          </div>
        )}
        {payouts.map((p) => {
          const kid = kids.find((k) => k.id === p.kidId)
          const d = new Date(p.paidAt)
          return (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <div className="font-medium" style={{ color: kid?.color }}>
                  {kid?.name ?? 'Hijo'}
                </div>
                <div className="text-[11px] text-gray-400">
                  {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="text-lg font-bold text-emerald-600">{euros(p.amountCents)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
