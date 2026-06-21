import Link from 'next/link'
import { getBoardData } from '@/lib/data'
import { getMoneyConfig } from '@/lib/settings'
import { todayYmd, ymd, addDays, parseYmd, formatRange, friendlyDay } from '@/lib/week'
import { formatAmount, unitIcon } from '@/lib/money'
import { markTask, undoTask, payKid } from './actions'
import { Nav } from '@/components/Nav'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'
import { CoinButton } from '@/components/CoinButton'
import { PayButton } from '@/components/PayButton'
import { DateNav } from '@/components/DateNav'

export const dynamic = 'force-dynamic'

function ProgressCoins({ count, target }: { count: number; target: number }) {
  const filled = Math.min(count, target)
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={i}
          className={`h-4 w-4 rounded-full border ${
            i < filled
              ? 'border-amber-500 bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm'
              : 'border-gray-200 bg-gray-100'
          }`}
        />
      ))}
      <span className="ml-1 font-display text-xs font-semibold text-[var(--ink-2)]">
        {count}/{target}
        {count > target ? ` +${count - target}` : ''}
      </span>
    </div>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string; d?: string }>
}) {
  const sp = await searchParams
  const today = todayYmd()
  const yesterday = ymd(addDays(parseYmd(today), -1))
  const selectedDate = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today
  const kidParam = sp.kid ? Number(sp.kid) : undefined

  const [data, money] = await Promise.all([getBoardData(selectedDate, kidParam), getMoneyConfig()])

  if (!data) {
    return (
      <div className="mx-auto max-w-md">
        <Nav active="inicio" />
        <div className="mx-3 mt-10 rounded-3xl bg-[var(--card)] p-6 text-center shadow-md">
          <p className="text-[var(--ink-2)]">Todavía no hay nadie dado de alta.</p>
          <Link href="/tareas" className="mt-3 inline-block rounded-2xl bg-indigo-600 px-4 py-2 font-display font-bold text-white">
            Añadir hijos y tareas
          </Link>
        </div>
      </div>
    )
  }

  const selKid = data.kids.find((k) => k.id === data.selectedKidId)!
  const inThisWeek = selectedDate >= data.range.start && selectedDate <= data.range.end

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="inicio" />

      {/* Selector de hijo */}
      <div className="grid grid-cols-2 gap-3 px-3">
        {data.kids.map((k) => {
          const on = k.id === selKid.id
          return (
            <Link
              key={k.id}
              href={`/?kid=${k.id}&d=${selectedDate}`}
              replace
              className={`tap-bounce relative overflow-hidden rounded-3xl p-3 text-center shadow-md transition ${
                on ? 'scale-[1.03] shadow-xl ring-4 ring-white' : 'opacity-90'
              }`}
              style={{ background: on ? k.color : 'var(--card)', color: on ? '#fff' : 'var(--ink)' }}
            >
              <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={56} className="float-soft mx-auto" />
              <div className="mt-1 font-display text-lg font-bold">{k.name}</div>
              <div
                className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-bold ${
                  on ? 'bg-white/25 text-white' : 'bg-[var(--chip)] text-[var(--chip-ink)]'
                }`}
              >
                {unitIcon(money)} {formatAmount(k.weekCents, money)}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Dinero del hijo seleccionado */}
      <div
        className="mx-3 mt-3 flex items-center justify-between overflow-hidden rounded-3xl p-4 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${selKid.color}, ${selKid.color}cc)` }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-display text-sm font-semibold text-white/85">
            <Avatar emoji={selKid.emoji} avatarUrl={selKid.avatarUrl} name={selKid.name} size={22} className="ring-1 ring-white/60" />
            {selKid.name} lleva ganado
          </div>
          <div className="font-display text-[2.6rem] font-bold leading-tight drop-shadow-sm">
            {formatAmount(selKid.balanceCents, money)}
          </div>
          <div className="text-xs font-semibold text-white/85">
            Esta semana {formatAmount(selKid.weekCents, money)}
          </div>
        </div>
        {money.unit === 'eur' ? (
          <form action={payKid}>
            <input type="hidden" name="kidId" value={selKid.id} />
            <PayButton
              message={`¿Pagar ${formatAmount(selKid.balanceCents, money)} a ${selKid.name} y poner su contador a 0?`}
              disabled={selKid.balanceCents <= 0}
            />
          </form>
        ) : (
          <Link
            href={`/recompensas?kid=${selKid.id}`}
            className="tap-bounce shrink-0 rounded-2xl bg-white/95 px-4 py-2.5 font-display text-base font-bold text-indigo-600 shadow-md ring-2 ring-white"
          >
            🎁 Canjear
          </Link>
        )}
      </div>

      {/* Día */}
      <div className="mx-3 mt-4">
        <DateNav kidId={selKid.id} selectedDate={selectedDate} today={today} yesterday={yesterday} />
        <p className="mt-1.5 px-1 text-[11px] font-semibold text-[var(--ink-3)]">
          Apuntando para <span className="text-[var(--ink-2)]">{friendlyDay(selectedDate)}</span>
          {' · '}semana {formatRange(data.range.start, data.range.end)}
          {!inThisWeek ? ' (anterior)' : ''}
        </p>
      </div>

      {/* Tareas */}
      <div className="mx-3 mt-2 space-y-2.5">
        {data.tasks.length === 0 && (
          <div className="rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
            No hay tareas todavía.{' '}
            <Link href="/tareas" className="font-bold text-indigo-600 underline">
              ¡Añade una!
            </Link>
          </div>
        )}
        {data.tasks.map((t) => {
          const week = data.weekCountByTask[t.id] ?? 0
          const day = data.dayCountByTask[t.id] ?? 0
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-3xl bg-[var(--card)] p-3 shadow-md animate-pop">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-inner"
                style={{ background: t.color }}
              >
                {t.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-bold text-[var(--ink)]">{t.name}</div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--chip)] px-2 py-0.5 text-xs font-bold text-[var(--chip-ink)]">
                  {unitIcon(money)} {formatAmount(t.valueCents, money)}
                </span>
                <ProgressCoins count={week} target={t.weeklyTarget} />
              </div>

              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <form action={markTask}>
                  <input type="hidden" name="kidId" value={selKid.id} />
                  <input type="hidden" name="taskId" value={t.id} />
                  <input type="hidden" name="doneOn" value={selectedDate} />
                  <CoinButton color={selKid.color} label={`Marcar ${t.name} para ${selKid.name}`} />
                </form>
                {day > 0 && (
                  <form action={undoTask} className="flex items-center gap-1">
                    <input type="hidden" name="kidId" value={selKid.id} />
                    <input type="hidden" name="taskId" value={t.id} />
                    <input type="hidden" name="doneOn" value={selectedDate} />
                    <SubmitButton
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-lg leading-none text-[var(--ink-2)]"
                      aria-label="Quitar una"
                    >
                      −
                    </SubmitButton>
                    <span className="font-display text-xs font-bold text-[var(--ink-3)]">×{day}</span>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
