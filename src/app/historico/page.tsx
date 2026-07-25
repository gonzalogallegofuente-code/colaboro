import Link from 'next/link'
import { getHistory, getWeekGrid } from '@/lib/data'
import { requireViewerPage } from '@/lib/session'
import { formatRange, todayYmd, weekRange, shiftWeek } from '@/lib/week'
import { formatAmount, unitIcon, moneyOf, themeOf } from '@/lib/money'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { KidWeekGrid } from '@/components/KidWeekGrid'

export const dynamic = 'force-dynamic'

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string; pk?: string }>
}) {
  const sp = await searchParams
  const viewer = await requireViewerPage()
  const accountId = viewer.accountId
  const today = todayYmd()
  const currentStart = weekRange(today).start

  // Semana mostrada (parám. w = cualquier fecha de la semana; por defecto, la
  // actual). Nunca más allá de la semana en curso.
  const wParam = sp.w && /^\d{4}-\d{2}-\d{2}$/.test(sp.w) ? weekRange(sp.w) : weekRange(today)
  const week = wParam.start > currentStart ? weekRange(today) : wParam
  const prevStart = shiftWeek(week.start, -1)
  const nextStart = shiftWeek(week.start, 1)
  const hasNext = nextStart <= currentStart

  // Hijo del parte (parám. pk); por defecto el primero. En modo niño se
  // fuerza SIEMPRE el suyo (no puede ver a los hermanos, ni por URL).
  const pkParam = viewer.isKid ? viewer.kidId! : sp.pk ? Number(sp.pk) : undefined
  const grid = await getWeekGrid(accountId, week.start, pkParam)
  const selKid = grid?.kids.find((k) => k.id === grid.selectedKidId)
  const theme = selKid ? themeOf(selKid) : 'infantil'
  // En modo niño: solo su tarjeta (y solo sus pagos, más abajo).
  const cardKids = grid ? (viewer.isKid ? grid.kids.filter((k) => k.id === grid.selectedKidId) : grid.kids) : []

  const { payouts: allPayouts, kids: allKids } = await getHistory(accountId)
  const payouts = viewer.isKid ? allPayouts.filter((p) => p.kidId === viewer.kidId) : allPayouts

  const navBtn =
    'tap-bounce flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--chip)] font-display text-lg font-bold text-[var(--chip-ink)]'

  return (
    <ThemeShell theme={theme}>
    <div className="mx-auto max-w-md pb-12">
      <Nav active="historico" kidMode={viewer.isKid} />

      <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">📅 Histórico semanal</h1>
      <p className="px-4 text-xs font-semibold text-[var(--ink-3)]">
        Toca un hijo para ver su semana (lun → dom).
        {!viewer.isKid && ' Toca una casilla para corregir un día.'}
      </p>

      {!grid || !selKid ? (
        <div className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
          Aún no hay nadie dado de alta.
        </div>
      ) : (
        <div className="mx-3 mt-3 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          {/* Selector de semana: ‹ 20–26 jul 2026 › */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <Link href={`/historico?w=${prevStart}&pk=${selKid.id}`} replace scroll={false} className={navBtn} aria-label="Semana anterior">
              ‹
            </Link>
            <span className="font-display text-base font-bold text-[var(--ink)]">
              {formatRange(week.start, week.end)}
            </span>
            {hasNext ? (
              <Link href={`/historico?w=${nextStart}&pk=${selKid.id}`} replace scroll={false} className={navBtn} aria-label="Semana siguiente">
                ›
              </Link>
            ) : (
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--chip)] font-display text-lg font-bold text-[var(--chip-ink)] opacity-30"
              >
                ›
              </span>
            )}
          </div>

          {/* Resumen por hijo: tocar uno abre su parte (en modo niño, solo él) */}
          <div className="grid grid-cols-2 gap-2">
            {cardKids.map((k) => {
              const money = moneyOf(k)
              const on = k.id === selKid.id
              const inner = (
                <>
                  <div className="flex items-center gap-1 font-display text-sm font-bold" style={{ color: k.color }}>
                    <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={18} />
                    {k.name}
                  </div>
                  <div className="font-display text-lg font-bold text-[var(--ink)]">
                    {unitIcon(money)} {formatAmount(k.weekCents, money)}
                  </div>
                  <div className="text-[11px] font-semibold text-[var(--ink-3)]">
                    {k.weekCount} {k.weekCount === 1 ? 'tarea' : 'tareas'}
                  </div>
                </>
              )
              if (viewer.isKid) {
                return (
                  <div key={k.id} className="col-span-2 rounded-2xl p-2.5" style={{ background: `${k.color}14` }}>
                    {inner}
                  </div>
                )
              }
              return (
                <Link
                  key={k.id}
                  href={`/historico?w=${week.start}&pk=${k.id}`}
                  replace
                  scroll={false}
                  className={`tap-bounce rounded-2xl p-2.5 ${on ? 'ring-2' : ''}`}
                  style={{ background: `${k.color}14`, ...(on ? { ['--tw-ring-color' as string]: k.color } : {}) }}
                >
                  {inner}
                </Link>
              )
            })}
          </div>

          {/* Parte de la semana del hijo elegido */}
          <div className="mt-3 border-t border-gray-100 pt-3">
            <KidWeekGrid kid={selKid} data={grid} today={today} editable={!viewer.isKid} />
          </div>
        </div>
      )}

      {/* Registro de liquidaciones (cuándo se pagó la hucha): plegado, es solo
          un comprobante — lo ganado por semana ya se ve arriba. */}
      {payouts.length > 0 && (
        <details className="mx-3 mt-6">
          <summary className="tap-bounce mx-auto w-fit cursor-pointer list-none rounded-full bg-[var(--card)] px-4 py-2 text-center font-display text-sm font-bold text-[var(--ink-2)] shadow-sm">
            💸 Pagos realizados ({payouts.length}) ▾
          </summary>
          <div className="mt-2 space-y-2">
        {payouts.map((p) => {
          const kid = allKids.find((k) => k.id === p.kidId)
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
              <div className="font-display text-lg font-bold text-emerald-600">
                {formatAmount(p.amountCents, moneyOf(kid ?? { unit: 'eur', pointsName: 'gemas', pointsIcon: '💎' }))}
              </div>
            </div>
          )
        })}
          </div>
        </details>
      )}
    </div>
    </ThemeShell>
  )
}
