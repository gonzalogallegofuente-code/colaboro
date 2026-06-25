import Link from 'next/link'
import { getHistory } from '@/lib/data'
import { getMoneyConfig } from '@/lib/settings'
import { requireAccountPage } from '@/lib/session'
import { formatRange, todayYmd, weekRange } from '@/lib/week'
import { formatAmount, unitIcon } from '@/lib/money'
import { Nav } from '@/components/Nav'
import { Avatar } from '@/components/Avatar'

export const dynamic = 'force-dynamic'

export default async function HistoricoPage() {
  const accountId = await requireAccountPage()
  const [{ kids, weeks, payouts }, money] = await Promise.all([
    getHistory(accountId),
    getMoneyConfig(accountId),
  ])
  const currentStart = weekRange(todayYmd()).start

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="historico" />

      <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">🏆 Histórico semanal</h1>
      <p className="px-4 text-xs font-semibold text-[var(--ink-3)]">Las semanas van de sábado a viernes.</p>

      <div className="mx-3 mt-3 space-y-2.5">
        {weeks.length === 0 && (
          <div className="rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
            Aún no hay nada apuntado. ¡A por la primera tarea! 💪
          </div>
        )}
        {weeks.map((w) => {
          const isCurrent = w.start === currentStart
          return (
            <div key={w.start} className="rounded-3xl bg-[var(--card)] p-3 shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-[var(--ink)]">
                  {formatRange(w.start, w.end)}
                </span>
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      en curso
                    </span>
                  )}
                  <Link
                    href={`/semana?w=${w.start}`}
                    className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600"
                  >
                    📅 ver días
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {kids.map((k) => {
                  const cell = w.perKid[k.id]
                  return (
                    <div
                      key={k.id}
                      className="rounded-2xl p-2.5"
                      style={{ background: `${k.color}14` }}
                    >
                      <div className="flex items-center gap-1 font-display text-sm font-bold" style={{ color: k.color }}>
                        <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={18} />
                        {k.name}
                      </div>
                      <div className="font-display text-lg font-bold text-[var(--ink)]">
                        {unitIcon(money)} {formatAmount(cell?.cents ?? 0, money)}
                      </div>
                      <div className="text-[11px] font-semibold text-[var(--ink-3)]">
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

      <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">💸 Pagos</h2>
      <div className="mx-3 mt-2 space-y-2">
        {payouts.length === 0 && (
          <div className="rounded-3xl bg-[var(--card)] p-4 text-center text-sm text-[var(--ink-2)] shadow-md">
            Todavía no se ha pagado nada.
          </div>
        )}
        {payouts.map((p) => {
          const kid = kids.find((k) => k.id === p.kidId)
          const d = new Date(p.paidAt)
          return (
            <div key={p.id} className="flex items-center justify-between rounded-3xl bg-[var(--card)] px-4 py-3 shadow-md">
              <div className="flex items-center gap-2">
                {kid && <Avatar emoji={kid.emoji} avatarUrl={kid.avatarUrl} name={kid.name} size={22} />}
                <div>
                  <div className="font-display font-bold" style={{ color: kid?.color }}>
                    {kid?.name ?? 'Hijo'}
                  </div>
                  <div className="text-[11px] font-semibold text-[var(--ink-3)]">
                    {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="font-display text-lg font-bold text-emerald-600">{formatAmount(p.amountCents, money)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
