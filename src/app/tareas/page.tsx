import { getAllTasks, getActiveKids } from '@/lib/data'
import { getMoneyConfig, getTheme } from '@/lib/settings'
import { unitWord } from '@/lib/money'
import { addKid, addTask, setPointsName, setTaskActive, setTheme, setUnit, updateKid, updateTask } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { SubmitButton } from '@/components/SubmitButton'
import { EmojiInput } from '@/components/EmojiInput'
import { AvatarUpload } from '@/components/AvatarUpload'
import { ColorPicker } from '@/components/ColorPicker'

export const dynamic = 'force-dynamic'

const TASK_ICONS = ['🧹', '🚽', '🚪', '🪟', '👕', '🪶', '🍳', '🧺', '🍽️', '🗑️', '🛏️', '🌱', '🐕', '📚', '🧽', '♻️']
const KID_EMOJIS = ['🦁', '🦊', '🐯', '🐻', '🐼', '🦄', '🚀', '⚽', '🎮', '🦖', '🐶', '🐱']
const POINT_ICONS = ['💎', '⭐', '🪙', '🦃', '⚡', '🏅', '🔶', '🌟', '🍪', '🔥']

function eurosInput(cents: number): string {
  return (cents / 100).toString().replace('.', ',')
}

export default async function TareasPage() {
  const [tasks, kids, money, theme] = await Promise.all([
    getAllTasks(),
    getActiveKids(),
    getMoneyConfig(),
    getTheme(),
  ])
  const inputCls =
    'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'
  const unitPill = (on: boolean) =>
    `tap-bounce rounded-xl px-4 py-1.5 font-display text-sm font-bold ${
      on ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-indigo-200 text-[var(--head)]'
    }`
  const themePill = (on: boolean) =>
    `tap-bounce w-full rounded-xl px-3 py-2 font-display text-sm font-bold leading-tight ${
      on ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-indigo-200 text-[var(--head)]'
    }`

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="tareas" />

      <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">⚙️ Ajustes</h1>

      {/* Diseño según la edad */}
      <div className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
        <span className="font-display text-sm font-bold text-[var(--ink)]">Diseño</span>
        <div className="mt-2 flex gap-2">
          <form action={setTheme} className="flex-1">
            <input type="hidden" name="theme" value="infantil" />
            <button className={themePill(theme === 'infantil')}>
              🧸 Infantil
              <span className="block text-[11px] font-normal opacity-80">hasta 9 años</span>
            </button>
          </form>
          <form action={setTheme} className="flex-1">
            <input type="hidden" name="theme" value="juvenil" />
            <button className={themePill(theme === 'juvenil')}>
              🎮 Juvenil
              <span className="block text-[11px] font-normal opacity-80">10 años en adelante</span>
            </button>
          </form>
        </div>
      </div>

      {/* Unidad: € o puntos */}
      <div className="mx-3 mt-2 flex items-center gap-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
        <span className="font-display text-sm font-bold text-[var(--ink)]">Contar en:</span>
        <form action={setUnit}>
          <input type="hidden" name="unit" value="eur" />
          <button className={unitPill(money.unit === 'eur')}>🪙 Euros</button>
        </form>
        <form action={setUnit}>
          <input type="hidden" name="unit" value="pts" />
          <button className={unitPill(money.unit === 'pts')}>{money.pointsIcon} Puntos</button>
        </form>
      </div>

      {/* Nombre de los puntos */}
      <form action={setPointsName} className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
        <span className="font-display text-sm font-bold text-[var(--ink)]">¿Cómo se llaman los puntos?</span>
        <div className="mt-2 flex items-start gap-3">
          <EmojiInput name="pointsIcon" defaultValue={money.pointsIcon} suggestions={POINT_ICONS} />
          <div className="flex-1">
            <input name="pointsName" defaultValue={money.pointsName} className={inputCls} placeholder="gemas" />
            <SubmitButton className="tap-bounce mt-2 rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
              Guardar
            </SubmitButton>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-[var(--ink-3)]">
          Ej.: «{money.pointsIcon} Leo tiene 5 {money.pointsName}». Solo se usa en modo puntos.
        </p>
      </form>

      <h2 className="px-4 pt-5 font-display text-lg font-bold text-[var(--head)]">🧹 Tareas</h2>
      <p className="px-4 text-xs font-semibold text-[var(--ink-3)]">
        Cambia el icono, el nombre, el valor o las veces por semana. «Ocultar» la quita del
        tablero sin borrar lo apuntado.
      </p>

      <div className="mx-3 mt-3 space-y-2.5">
        {tasks.map((t) => (
          <div
            key={t.id}
            className={`rounded-3xl bg-[var(--card)] p-3 shadow-md ${t.active ? '' : 'opacity-60'}`}
          >
            <form action={updateTask}>
              <input type="hidden" name="id" value={t.id} />
              <div className="flex gap-3">
                <EmojiInput name="icon" defaultValue={t.icon} suggestions={TASK_ICONS} />
                <div className="flex-1">
                  <input
                    name="name"
                    defaultValue={t.name}
                    className={`${inputCls} font-display font-bold`}
                    placeholder="Nombre"
                  />
                  <input
                    name="description"
                    defaultValue={t.description ?? ''}
                    className={`${inputCls} mt-1.5 text-[var(--ink-2)]`}
                    placeholder="Descripción (opcional)"
                  />
                </div>
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
              <SubmitButton className="tap-bounce mt-2.5 rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                Guardar
              </SubmitButton>
            </form>
            <ToggleActive id={t.id} active={t.active} />
          </div>
        ))}
      </div>

      {/* Añadir tarea */}
      <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">➕ Nueva tarea</h2>
      <form action={addTask} className="mx-3 mt-2 rounded-3xl bg-[var(--card)] p-3 shadow-md">
        <div className="flex gap-3">
          <EmojiInput name="icon" defaultValue="⭐" suggestions={TASK_ICONS} />
          <div className="flex-1">
            <input name="name" placeholder="Nombre de la tarea" className={`${inputCls} font-display font-bold`} required />
            <input name="description" placeholder="Descripción (opcional)" className={`${inputCls} mt-1.5`} />
          </div>
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
        <SubmitButton className="tap-bounce mt-3 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
          Añadir tarea
        </SubmitButton>
      </form>

      {/* Hijos */}
      <h2 className="px-4 pt-6 font-display text-lg font-bold text-[var(--head)]">🧒 Hijos</h2>
      <div className="mx-3 mt-2 space-y-2.5">
        {kids.map((k) => (
          <form key={k.id} action={updateKid} className="rounded-3xl bg-[var(--card)] p-3 shadow-md">
            <input type="hidden" name="id" value={k.id} />
            <div className="flex items-start gap-3">
              <AvatarUpload emoji={k.emoji} initialUrl={k.avatarUrl} />
              <div className="flex-1 space-y-2">
                <input name="name" defaultValue={k.name} className={`${inputCls} font-display font-bold`} />
                <div>
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Emoji (si no hay foto)</span>
                  <EmojiInput name="emoji" defaultValue={k.emoji} suggestions={KID_EMOJIS} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[var(--ink-3)]">Color</span>
                  <ColorPicker name="color" defaultValue={k.color} />
                </div>
                <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                  Guardar
                </SubmitButton>
              </div>
            </div>
          </form>
        ))}

        <form action={addKid} className="rounded-3xl bg-[var(--card)] p-3 shadow-md">
          <div className="flex items-center gap-2">
            <EmojiInput name="emoji" defaultValue="🙂" suggestions={KID_EMOJIS} />
            <input name="name" placeholder="Nombre del hijo" className={`${inputCls} flex-1`} required />
          </div>
          <div className="mt-2">
            <span className="text-[11px] font-semibold text-[var(--ink-3)]">Color</span>
            <ColorPicker name="color" defaultValue="#16a34a" />
          </div>
          <SubmitButton className="tap-bounce mt-2 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
            Añadir hijo
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}

function ToggleActive({ id, active }: { id: number; active: boolean }) {
  return (
    <form action={setTaskActive} className="mt-2 text-right">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? '0' : '1'} />
      <SubmitButton className="text-xs font-semibold text-[var(--ink-3)] underline underline-offset-2">
        {active ? 'Ocultar del tablero' : 'Activar'}
      </SubmitButton>
    </form>
  )
}
