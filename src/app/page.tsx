import Link from 'next/link'
import { getBoardData } from '@/lib/data'
import { todayYmd, ymd, addDays, parseYmd, formatRange, friendlyDay } from '@/lib/week'
import { euros } from '@/lib/money'
import { markTask, undoTask, payKid } from './actions'
import { Nav } from '@/components/Nav'
import { SubmitButton } from '@/components/SubmitButton'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { DateNav } from '@/components/DateNav'

export const dynamic = 'force-dynamic'

function ProgressBoxes({ count, target, color }: { count: number; target: number; color: string }) {
  const filled = Math.min(count, target)
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {Array.from({ length: target }).map((_, i) => (
        <span
          key={i}
          className="h-3.5 w-3.5 rounded-[3px] border"
          style={{ background: i < filled ? color : 'transparent', borderColor: color }}
        />
      ))}
      <span className="ml-1 text-[11px] text-gray-500">
        {count}/{target}
        {count > target ? ` (+${count - target})` : ''}
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

  const data = await getBoardData(selectedDate, kidParam)

  if (!data) {
    return (
      <div className="mx-auto max-w-md">
        <Nav active="inicio" />
        <div className="mx-3 mt-10 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-gray-600">Todavía no hay nadie dado de alta.</p>
          <Link href="/tareas" className="mt-3 inline-block rounded-xl bg-gray-900 px-4 py-2 text-white">
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

      {/* Pestañas por hijo */}
      <div className="grid grid-cols-2 gap-2 px-3">
        {data.kids.map((k) => {
          const on = k.id === selKid.id
          return (
            <Link
              key={k.id}
              href={`/?kid=${k.id}&d=${selectedDate}`}
              replace
              className="rounded-2xl border-2 p-3 text-center transition"
              style={{ borderColor: k.color, background: on ? `${k.color}1a` : '#fff' }}
            >
              <div className="font-bold" style={{ color: k.color }}>
                {k.name}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-gray-400">Esta semana</div>
              <div className="text-lg font-extrabold text-gray-800">{euros(k.weekCents)}</div>
            </Link>
          )
        })}
      </div>

      {/* Resumen de dinero del hijo seleccionado */}
      <div className="mx-3 mt-3 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-400">Sin pagar</div>
          <div className="text-3xl font-extrabold" style={{ color: selKid.color }}>
            {euros(selKid.balanceCents)}
          </div>
          <div className="mt-1 text-xs text-gray-500">Esta semana {euros(selKid.weekCents)}</div>
        </div>
        <form action={payKid}>
          <input type="hidden" name="kidId" value={selKid.id} />
          <ConfirmSubmit
            message={`¿Pagar ${euros(selKid.balanceCents)} a ${selKid.name} y poner su contador a 0?`}
            disabled={selKid.balanceCents <= 0}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm disabled:opacity-40"
          >
            Pagar
          </ConfirmSubmit>
        </form>
      </div>

      {/* Selector de día */}
      <div className="mx-3 mt-4">
        <DateNav kidId={selKid.id} selectedDate={selectedDate} today={today} yesterday={yesterday} />
        <p className="mt-1.5 px-1 text-[11px] text-gray-400">
          Apuntando para <span className="font-medium text-gray-500">{friendlyDay(selectedDate)}</span>
          {' · '}semana {formatRange(data.range.start, data.range.end)}
          {!inThisWeek ? ' (semana anterior)' : ''}
        </p>
      </div>

      {/* Lista de tareas */}
      <div className="mx-3 mt-2 space-y-2">
        {data.tasks.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
            No hay tareas.{' '}
            <Link href="/tareas" className="font-medium text-gray-900 underline">
              Añade alguna
            </Link>
            .
          </div>
        )}
        {data.tasks.map((t) => {
          const week = data.weekCountByTask[t.id] ?? 0
          const day = data.dayCountByTask[t.id] ?? 0
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
              style={{ borderLeft: `6px solid ${t.color}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate font-semibold text-gray-800">{t.name}</span>
                  <span className="shrink-0 text-xs text-gray-400">{euros(t.valueCents)}</span>
                </div>
                {t.description && (
                  <div className="truncate text-[11px] text-gray-400">{t.description}</div>
                )}
                <ProgressBoxes count={week} target={t.weeklyTarget} color={t.color} />
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {day > 0 && (
                  <>
                    <form action={undoTask}>
                      <input type="hidden" name="kidId" value={selKid.id} />
                      <input type="hidden" name="taskId" value={t.id} />
                      <input type="hidden" name="doneOn" value={selectedDate} />
                      <SubmitButton
                        className="flex h-9 w-9 items-center justify-center rounded-full border text-xl leading-none text-gray-400"
                        aria-label="Quitar una"
                      >
                        −
                      </SubmitButton>
                    </form>
                    <span className="w-4 text-center text-sm font-bold text-gray-700">{day}</span>
                  </>
                )}
                <form action={markTask}>
                  <input type="hidden" name="kidId" value={selKid.id} />
                  <input type="hidden" name="taskId" value={t.id} />
                  <input type="hidden" name="doneOn" value={selectedDate} />
                  <SubmitButton
                    className="flex h-12 w-12 items-center justify-center rounded-full text-3xl leading-none text-white shadow-sm active:scale-95"
                    style={{ background: selKid.color }}
                    aria-label={`Marcar ${t.name} para ${selKid.name}`}
                  >
                    +
                  </SubmitButton>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
