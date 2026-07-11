import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getActiveKids, getAllTasks } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { unitWord, moneyOf, themeOf, formatAmount } from '@/lib/money'
import { addTask, setTaskActive, setWeekMode, toggleInPlan, updateTask } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'
import { AutoForm } from '@/components/AutoForm'
import { IconPicker } from '@/components/IconPicker'
import { IconDefs, keysForStyle } from '@/components/IconDefs'
import { TaskGlyph } from '@/components/TaskGlyph'
import { iconColor, type IconStyle } from '@/lib/icons'

export const dynamic = 'force-dynamic'

const inputCls = 'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

function eurosInput(cents: number): string {
  return (cents / 100).toString().replace('.', ',')
}

export default async function EditarTareasPage({
  searchParams,
}: {
  searchParams: Promise<{ kid?: string }>
}) {
  const sp = await searchParams
  const accountId = await requireAccountPage()
  const kids = await getActiveKids(accountId)

  if (kids.length === 0) {
    return (
      <ThemeShell theme="infantil">
        <div className="mx-auto max-w-md">
          <Nav active="tareas" />
          <div className="mx-3 mt-10 rounded-3xl bg-[var(--card)] p-6 text-center text-[var(--ink-2)] shadow-md">
            Primero añade un hijo en{' '}
            <Link href="/tareas" className="font-bold text-indigo-600 underline">
              Ajustes
            </Link>
            .
          </div>
        </div>
      </ThemeShell>
    )
  }

  // Cada pantalla de edición es SOLO del hijo desde cuyos ajustes se abrió.
  const kidParam = sp.kid ? Number(sp.kid) : undefined
  const selKid = kids.find((k) => k.id === kidParam)
  if (!selKid) redirect('/tareas')
  const money = moneyOf(selKid)
  const theme = themeOf(selKid)
  const iconStyle = selKid.iconStyle as IconStyle
  const availableKeys = keysForStyle(iconStyle)
  const tasks = await getAllTasks(accountId, selKid.id)
  // El "objetivo semanal" que se está fijando: solo las tareas marcadas 🗓️.
  const modoObjetivo = selKid.weekMode === 'objetivo'
  const enPlan = tasks.filter((t) => t.active && t.inPlan)
  const planVeces = enPlan.reduce((a, t) => a + t.weeklyTarget, 0)
  const planCents = enPlan.reduce((a, t) => a + t.valueCents * t.weeklyTarget, 0)
  const modePill = (on: boolean) =>
    `tap-bounce w-full rounded-xl border-2 px-3 py-2 font-display text-sm font-bold leading-tight ${
      on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-indigo-200 text-[var(--head)]'
    }`

  return (
    <ThemeShell theme={theme}>
      <div className="mx-auto max-w-md pb-12">
        <Nav active="tareas" />

        <div className="flex items-center justify-between px-4 pt-2">
          <h1 className="font-display text-xl font-bold text-[var(--head)]">✏️ Editar tareas</h1>
          <Link href={`/tareas/${selKid.id}`} className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm">
            ← Volver
          </Link>
        </div>
        <p className="px-4 pt-1 text-xs font-semibold leading-snug text-[var(--ink-3)]">
          Cambia el nombre, el valor o las veces por semana: <span className="text-[var(--ink-2)]">se guarda solo</span>.
          Valor <span className="text-[var(--ink-2)]">0</span> = tarea de convivencia 🤝 (cuenta para rachas y logros,
          sin dinero).
        </p>

        {/* Hijo elegido (solo se editan SUS tareas) — fijo al hacer scroll */}
        <div className="sticky top-14 z-20 bg-[var(--nav)] px-3 py-2 backdrop-blur-md">
          <div
            className="flex items-center justify-center gap-2 rounded-2xl px-2 py-2 text-white shadow-md"
            style={{ background: selKid.color }}
          >
            <Avatar emoji={selKid.emoji} avatarUrl={selKid.avatarUrl} name={selKid.name} size={28} />
            <span className="font-display font-bold">Tareas de {selKid.name}</span>
          </div>
        </div>

        {/* Cómo cuenta la semana: libre u objetivo acordado */}
        <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <span className="font-display text-sm font-bold text-[var(--ink)]">Cómo cuenta la semana</span>
          <div className="mt-2 flex gap-2">
            <form action={setWeekMode} className="flex-1">
              <input type="hidden" name="kidId" value={selKid.id} />
              <input type="hidden" name="mode" value="tareas" />
              <button className={modePill(!modoObjetivo)}>🧹 Por tareas (libre)</button>
            </form>
            <form action={setWeekMode} className="flex-1">
              <input type="hidden" name="kidId" value={selKid.id} />
              <input type="hidden" name="mode" value="objetivo" />
              <button className={modePill(modoObjetivo)}>🗓️ Objetivo semanal</button>
            </form>
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-[var(--ink-3)]">
            {modoObjetivo
              ? 'Con objetivo: el tablero muestra las tareas acordadas (🗓️) con su barra de progreso, y el resto como extras. ¡Más motivador!'
              : 'Libre: todas las tareas a la vista, se marca sin límite y sin objetivo.'}
          </p>
        </div>

        {/* Resumen del objetivo que se está fijando */}
        {modoObjetivo && (
          <p className="mx-4 mt-1 text-center text-[11.5px] font-semibold text-[var(--ink-3)]">
            {planVeces > 0 ? (
              <>
                🗓️ El objetivo semanal de {selKid.name} suma{' '}
                <span className="text-[var(--ink-2)]">{planVeces} tareas</span>
                {planCents > 0 && (
                  <>
                    {' '}y hasta <span className="text-[var(--ink-2)]">{formatAmount(planCents, money)}</span>
                  </>
                )}
                . Empieza realista: mejor un objetivo que se pueda completar 😉
              </>
            ) : (
              <>🗓️ Aún no hay objetivo: pulsa "🗓️ Añadir al objetivo" en las tareas que acordéis (se guarda al toque).</>
            )}
          </p>
        )}

        <IconDefs style={iconStyle} />

        <div className="mx-3 mt-3 space-y-2.5">
          {tasks.map((t) => (
            <div key={t.id} className={`rounded-3xl bg-[var(--card)] p-3 shadow-md ${t.active ? '' : 'opacity-60'}`}>
              <AutoForm action={updateTask}>
                <input type="hidden" name="id" value={t.id} />
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: t.color }}>
                    <TaskGlyph iconKey={t.iconKey} emoji={t.icon} style={selKid.iconStyle as IconStyle} size={22} color={iconColor(t.color)} />
                  </span>
                  <input name="name" defaultValue={t.name} className={`${inputCls} flex-1 font-display font-bold`} placeholder="Nombre" />
                </div>
                <input name="description" defaultValue={t.description ?? ''} className={`${inputCls} mt-1.5 text-[var(--ink-2)]`} placeholder="Descripción (opcional)" />
                <div className="mt-2">
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Icono</span>
                  <IconPicker defaultIcon={t.icon} defaultKey={t.iconKey} style={iconStyle} availableKeys={availableKeys} autoSubmit />
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <label className="flex-1">
                    <span className="text-[11px] font-semibold text-[var(--ink-3)]">Valor ({unitWord(money)})</span>
                    <input name="value" defaultValue={eurosInput(t.valueCents)} inputMode="decimal" className={inputCls} />
                  </label>
                  <label className="flex-1">
                    <span className="text-[11px] font-semibold text-[var(--ink-3)]">Veces/semana</span>
                    <input name="weeklyTarget" type="number" min={1} max={31} defaultValue={t.weeklyTarget} className={inputCls} />
                  </label>
                </div>
              </AutoForm>
              <div className="mt-2 flex items-center justify-between gap-2">
                {modoObjetivo ? (
                  <form action={toggleInPlan}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="inPlan" value={t.inPlan ? '0' : '1'} />
                    <SubmitButton
                      className={`tap-bounce rounded-full px-3 py-1.5 text-xs font-bold ${
                        t.inPlan
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'border-2 border-emerald-300 text-emerald-700'
                      }`}
                    >
                      {t.inPlan ? '🗓️ En el objetivo ✓ (quitar)' : '🗓️ Añadir al objetivo'}
                    </SubmitButton>
                  </form>
                ) : (
                  <span />
                )}
                <ToggleActive id={t.id} active={t.active} />
              </div>
            </div>
          ))}

          <form action={addTask} className="rounded-3xl border-2 border-dashed border-indigo-200 bg-[var(--card)] p-3">
            <input type="hidden" name="kidId" value={selKid.id} />
            <input name="name" placeholder={`Nueva tarea para ${selKid.name}`} className={`${inputCls} font-display font-bold`} required />
            <input name="description" placeholder="Descripción (opcional)" className={`${inputCls} mt-1.5`} />
            <div className="mt-2">
              <span className="text-[11px] font-semibold text-[var(--ink-3)]">Icono</span>
              <IconPicker defaultIcon="⭐" defaultKey={null} style={iconStyle} availableKeys={availableKeys} />
            </div>
            <div className="mt-2 flex items-end gap-2">
              <label className="flex-1">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Valor ({unitWord(money)})</span>
                <input name="value" defaultValue="1" inputMode="decimal" className={inputCls} />
              </label>
              <label className="flex-1">
                <span className="text-[11px] font-semibold text-[var(--ink-3)]">Veces/semana</span>
                <input name="weeklyTarget" type="number" min={1} max={31} defaultValue={7} className={inputCls} />
              </label>
            </div>
            <SubmitButton className="tap-bounce mt-2.5 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
              Añadir tarea
            </SubmitButton>
          </form>
        </div>
      </div>
    </ThemeShell>
  )
}

function ToggleActive({ id, active }: { id: number; active: boolean }) {
  return (
    <form action={setTaskActive} className="shrink-0">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? '0' : '1'} />
      <SubmitButton className="text-xs font-semibold text-[var(--ink-3)] underline underline-offset-2">
        {active ? 'Ocultar del tablero' : 'Activar'}
      </SubmitButton>
    </form>
  )
}
