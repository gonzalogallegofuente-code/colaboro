import { Fragment } from 'react'
import Link from 'next/link'
import { getWeekGrid } from '@/lib/data'
import { requireViewerPage } from '@/lib/session'
import { todayYmd, formatRange, shiftWeek } from '@/lib/week'
import { formatAmount, unitIcon, moneyOf, themeOf } from '@/lib/money'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { TaskGlyph } from '@/components/TaskGlyph'
import type { IconStyle } from '@/lib/icons'

export const dynamic = 'force-dynamic'

function Cell({ count, today }: { count: number; today: boolean }) {
  return (
    <div className={`flex h-9 items-center justify-center rounded-lg ${today ? 'bg-indigo-50' : ''}`}>
      {count > 0 ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[10px] font-bold text-amber-900 shadow-sm">
          {count > 1 ? count : ''}
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
      )}
    </div>
  )
}

export default async function SemanaPage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string; w?: string }>
}) {
  const sp = await searchParams
  const today = todayYmd()
  const anchor = sp.w && /^\d{4}-\d{2}-\d{2}$/.test(sp.w) ? sp.w : today
  const kidParam = sp.kid ? Number(sp.kid) : undefined

  const viewer = await requireViewerPage()
  const isKid = viewer.isKid
  const data = await getWeekGrid(viewer.accountId, anchor, isKid ? viewer.kidId! : kidParam)

  if (!data) {
    return (
      <ThemeShell theme="infantil">
        <div className="mx-auto max-w-md">
          <Nav active="semana" kidMode={isKid} />
          <div className="mx-3 mt-10 rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
            Todavía no hay nadie dado de alta.
          </div>
        </div>
      </ThemeShell>
    )
  }

  const { kids, tasks, selectedKidId, range, days, grid, dayCents } = data
  const selKid = kids.find((k) => k.id === selectedKidId) ?? kids[0]
  const money = moneyOf(selKid)
  const theme = themeOf(selKid)
  const currentStart = shiftWeek(today, 0)
  const isCurrent = range.start === currentStart
  const canGoNext = range.start < currentStart
  const cols = { gridTemplateColumns: '1.35fr repeat(7, 1fr)' }

  return (
    <ThemeShell theme={theme}>
    <div className="mx-auto max-w-md pb-12">
      <Nav active="semana" kidMode={isKid} />

      <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">📅 Parte semanal</h1>
      <p className="px-4 text-xs font-semibold text-[var(--ink-3)]">Qué día hizo cada cosa. 🪙 = hecho ese día.</p>

      {/* Hijo (oculto en modo niño) */}
      {!isKid && (
      <div className="mt-3 flex gap-2 px-3">
        {kids.map((k) => {
          const on = k.id === selectedKidId
          return (
            <Link
              key={k.id}
              href={`/semana?kid=${k.id}&w=${range.start}`}
              replace
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-2 py-2 shadow-sm ${
                on ? 'shadow-md ring-2 ring-white' : ''
              }`}
              style={{ background: on ? k.color : 'var(--card)', color: on ? '#fff' : 'var(--ink)' }}
            >
              <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={28} />
              <span className="font-display font-bold">{k.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${on ? 'bg-white/25 text-white' : 'bg-[var(--chip)] text-[var(--chip-ink)]'}`}>
                {unitIcon(moneyOf(k))} {formatAmount(k.weekCents, moneyOf(k))}
              </span>
            </Link>
          )
        })}
      </div>
      )}

      {/* Semana ◀ ▶ */}
      <div className="mx-3 mt-3 flex items-center justify-between">
        <Link
          href={`/semana?kid=${selectedKidId}&w=${shiftWeek(range.start, -1)}`}
          replace
          className="tap-bounce rounded-full bg-[var(--card)] px-3 py-1.5 font-display font-bold text-[var(--head)] shadow-sm"
          aria-label="Semana anterior"
        >
          ◀
        </Link>
        <div className="text-center">
          <div className="font-display font-bold text-[var(--head)]">{formatRange(range.start, range.end)}</div>
          {isCurrent && <div className="text-[11px] font-semibold text-emerald-600">esta semana</div>}
        </div>
        {canGoNext ? (
          <Link
            href={`/semana?kid=${selectedKidId}&w=${shiftWeek(range.start, 1)}`}
            replace
            className="tap-bounce rounded-full bg-[var(--card)] px-3 py-1.5 font-display font-bold text-[var(--head)] shadow-sm"
            aria-label="Semana siguiente"
          >
            ▶
          </Link>
        ) : (
          <span className="rounded-full px-3 py-1.5 font-display font-bold text-indigo-300">▶</span>
        )}
      </div>

      {/* Cuadrícula */}
      <div className="mx-3 mt-2 overflow-hidden rounded-3xl bg-[var(--card)] p-2.5 shadow-md">
        <div className="grid items-center gap-1" style={cols}>
          {/* cabecera de días */}
          <div />
          {days.map((d) => (
            <div key={d.ymd} className={`rounded-lg py-1 text-center ${d.ymd === today ? 'bg-indigo-100' : ''}`}>
              <div className="text-[10px] font-bold uppercase text-[var(--ink-3)]">{d.dow}</div>
              <div className="font-display text-xs font-bold text-[var(--head)]">{d.dom}</div>
            </div>
          ))}

          {/* filas de tareas */}
          {tasks.map((t) => (
            <Fragment key={t.id}>
              <div className="flex items-center gap-1.5 pr-1">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: t.color }}
                >
                  <TaskGlyph iconKey={t.iconKey} emoji={t.icon} style={selKid.iconStyle as IconStyle} size={18} color="#3f3f55" />
                </span>
                <span className="truncate text-[11px] font-semibold leading-tight text-[var(--ink)]">{t.name}</span>
              </div>
              {days.map((d, i) => (
                <Cell key={d.ymd} count={grid[t.id]?.[i] ?? 0} today={d.ymd === today} />
              ))}
            </Fragment>
          ))}

          {/* totales por día */}
          <div className="pr-1 text-right text-[11px] font-bold text-[var(--ink-3)]">Total</div>
          {dayCents.map((c, i) => (
            <div
              key={i}
              className={`rounded-lg py-1 text-center text-[10px] font-bold ${days[i].ymd === today ? 'bg-indigo-50' : ''} ${
                c > 0 ? 'text-emerald-600' : 'text-gray-300'
              }`}
            >
              {c > 0
                ? money.unit === 'pts'
                  ? String(Math.round((c / 100) * 100) / 100).replace('.', ',')
                  : (c / 100).toFixed(2).replace('.', ',')
                : '·'}
            </div>
          ))}
        </div>
      </div>
    </div>
    </ThemeShell>
  )
}
