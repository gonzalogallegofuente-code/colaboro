import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getActiveKids, getAllTasks } from '@/lib/data'
import { requireAccountPage } from '@/lib/session'
import { unitWord, moneyOf, themeOf, formatAmount } from '@/lib/money'
import { addTask, deleteTask, setTaskActive, setWeekMode, toggleInPlan, updateTask } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { AutoForm } from '@/components/AutoForm'
import { TaskGlyph } from '@/components/TaskGlyph'
import { SlugPicker } from '@/components/SlugPicker'
import { edadTaskSrc } from '@/lib/edad-icons'
import { type IconStyle } from '@/lib/icons'

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
  const tasks = await getAllTasks(accountId, selKid.id)
  // Activas primero; las ocultas se pliegan a una línea al final de la lista.
  const ordered = [...tasks].sort((a, b) => Number(b.active) - Number(a.active))
  // El "objetivo semanal" que se está fijando: solo las tareas marcadas 🗓️.
  const modoObjetivo = selKid.weekMode === 'objetivo'
  const enPlan = tasks.filter((t) => t.active && t.inPlan)
  const planVeces = enPlan.reduce((a, t) => a + t.weeklyTarget, 0)
  const planCents = enPlan.reduce((a, t) => a + t.valueCents * t.weeklyTarget, 0)
  const modePill = (on: boolean) =>
    `tap-bounce w-full rounded-xl border-2 px-3 py-2 font-display text-sm font-bold leading-tight ${
      on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-indigo-200 text-[var(--head)]'
    }`

  // Reparto: activas / ocultas; y en modo objetivo, dentro (expandidas) vs fuera.
  const activas = ordered.filter((t) => t.active)
  const ocultas = ordered.filter((t) => !t.active)
  const dentro = activas.filter((t) => t.inPlan)
  const fuera = activas.filter((t) => !t.inPlan)
  const subHead = 'px-2 pt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-3)]'

  // Tarjeta expandida y editable (activas en libre; las del objetivo en objetivo).
  const cardExpandida = (t: (typeof tasks)[number]) => (
    <div
      key={t.id}
      className={`rounded-3xl p-3 shadow-md ${modoObjetivo ? 'bg-emerald-50 ring-2 ring-emerald-300' : 'bg-[var(--card)]'}`}
    >
      <AutoForm action={updateTask}>
        <input type="hidden" name="id" value={t.id} />
        {/* Línea 1: dibujo (tocable → galería para cambiarlo) + nombre */}
        <SlugPicker
          edad={theme}
          defaultSlug={t.iconSlug}
          fallbackSrc={edadTaskSrc(theme, { iconKey: t.iconKey, emoji: t.icon, name: t.name })}
          autoSubmit
        >
          <input name="name" defaultValue={t.name} className={`${inputCls} min-w-0 flex-1 font-display font-bold`} placeholder="Nombre" />
        </SlugPicker>
        {/* Línea 2: descripción */}
        <input name="description" defaultValue={t.description ?? ''} className={`${inputCls} mt-1.5 text-[var(--ink-2)]`} placeholder="Descripción (opcional)" />
        {/* Línea 3: valor + veces/sem (estrechos) + quitar del objetivo + ocultar */}
        <div className="mt-2 flex items-end gap-1.5">
          <label className="w-16 shrink-0">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Valor</span>
            <input name="value" defaultValue={eurosInput(t.valueCents)} inputMode="decimal" className={inputCls} />
          </label>
          <label className="w-16 shrink-0">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Veces/sem</span>
            <input name="weeklyTarget" type="number" min={1} max={31} defaultValue={t.weeklyTarget} className={inputCls} />
          </label>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 pb-1">
            <button
              form={`ocultar-${t.id}`}
              className="tap-bounce shrink-0 rounded-full bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold leading-tight text-gray-600"
            >
              Desactivar
            </button>
          </div>
        </div>
      </AutoForm>
      {/* Formulario del botón Desactivar (fuera para no anidar formularios) */}
      <form id={`ocultar-${t.id}`} action={setTaskActive}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="active" value="0" />
      </form>
    </div>
  )

  // Fila plegada de una tarea que NO está en el objetivo: botón para sumarla.
  const filaAlObjetivo = (t: (typeof tasks)[number]) => (
    <div key={t.id} className="flex items-center gap-2 rounded-3xl bg-[var(--card)] p-2.5 shadow-sm">
      <TaskGlyph iconKey={t.iconKey} iconSlug={t.iconSlug} emoji={t.icon} name={t.name} style={theme as IconStyle} size={32} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-[var(--ink)]">{t.name}</span>
      <button
        form={`objetivo-${t.id}`}
        className="tap-bounce shrink-0 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold leading-tight text-white shadow-sm"
      >
        ➕ Al objetivo
      </button>
      <form id={`objetivo-${t.id}`} action={toggleInPlan}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="inPlan" value="1" />
      </form>
    </div>
  )

  // Fila plegada de una tarea oculta: botón para activarla.
  const filaOculta = (t: (typeof tasks)[number]) => (
    <div key={t.id} className="flex items-center gap-2 rounded-3xl bg-[var(--card)] p-2.5 opacity-60 shadow-sm">
      <TaskGlyph iconKey={t.iconKey} iconSlug={t.iconSlug} emoji={t.icon} name={t.name} style={theme as IconStyle} size={32} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-[var(--ink)]">{t.name}</span>
      <button
        form={`ocultar-${t.id}`}
        className="tap-bounce shrink-0 rounded-full bg-gray-100 px-2.5 py-1.5 text-[11px] font-bold leading-tight text-gray-600"
      >
        Activar
      </button>
      <ConfirmSubmit
        form={`borrar-${t.id}`}
        message={`¿Borrar «${t.name}» para siempre? Se elimina también su historial de marcas. No se puede deshacer.`}
        className="tap-bounce flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-base leading-none text-red-500"
        aria-label={`Borrar ${t.name}`}
      >
        🗑️
      </ConfirmSubmit>
      <form id={`ocultar-${t.id}`} action={setTaskActive}>
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="active" value="1" />
      </form>
      <form id={`borrar-${t.id}`} action={deleteTask}>
        <input type="hidden" name="id" value={t.id} />
      </form>
    </div>
  )

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
              <>🗓️ Aún no hay objetivo: pulsa "➕ Al objetivo" en las tareas de abajo que acordéis.</>
            )}
          </p>
        )}

        <div className="mx-3 mt-3 space-y-2.5">
          {/* En modo objetivo: solo las del objetivo salen desplegadas (verde);
              las demás quedan plegadas abajo con un botón para sumarlas. */}
          {modoObjetivo ? (
            <>
              {dentro.map(cardExpandida)}
              {fuera.length > 0 && (
                <>
                  <p className={subHead}>Otras tareas (no cuentan para el objetivo)</p>
                  {fuera.map(filaAlObjetivo)}
                </>
              )}
            </>
          ) : (
            activas.map(cardExpandida)
          )}

          {ocultas.length > 0 && (
            <>
              <p className={subHead}>Desactivadas</p>
              {ocultas.map(filaOculta)}
            </>
          )}

          <form action={addTask} className="rounded-3xl border-2 border-dashed border-indigo-200 bg-[var(--card)] p-3">
            <input type="hidden" name="kidId" value={selKid.id} />
            <SlugPicker edad={theme} defaultSlug={null} fallbackSrc={`/icons/${theme}/estrella.svg`}>
              <input name="name" placeholder={`Nueva tarea para ${selKid.name}`} className={`${inputCls} min-w-0 flex-1 font-display font-bold`} required />
            </SlugPicker>
            <input name="description" placeholder="Descripción (opcional)" className={`${inputCls} mt-1.5`} />
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

