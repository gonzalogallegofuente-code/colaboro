import { getAllTasks, getActiveKids } from '@/lib/data'
import { addKid, addTask, setTaskActive, updateKid, updateTask } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { SubmitButton } from '@/components/SubmitButton'
import { EmojiInput } from '@/components/EmojiInput'

export const dynamic = 'force-dynamic'

const TASK_ICONS = ['🧹', '🚽', '🚪', '🪟', '👕', '🪶', '🍳', '🧺', '🍽️', '🗑️', '🛏️', '🌱', '🐕', '📚', '🧽', '♻️']
const KID_EMOJIS = ['🦁', '🦊', '🐯', '🐻', '🐼', '🦄', '🚀', '⚽', '🎮', '🦖', '🐶', '🐱']

function eurosInput(cents: number): string {
  return (cents / 100).toString().replace('.', ',')
}

export default async function TareasPage() {
  const [tasks, kids] = await Promise.all([getAllTasks(), getActiveKids()])
  const inputCls =
    'w-full rounded-xl border-2 border-indigo-100 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500'

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="tareas" />

      <h1 className="px-4 pt-2 font-display text-xl font-bold text-indigo-800">⚙️ Tareas</h1>
      <p className="px-4 text-xs font-semibold text-indigo-900/50">
        Cambia el icono, el nombre, el valor (€) o las veces por semana. «Ocultar» la quita del
        tablero sin borrar lo apuntado.
      </p>

      <div className="mx-3 mt-3 space-y-2.5">
        {tasks.map((t) => (
          <form
            key={t.id}
            action={updateTask}
            className={`rounded-3xl bg-white/90 p-3 shadow-md ${t.active ? '' : 'opacity-60'}`}
          >
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
                  className={`${inputCls} mt-1.5 text-gray-500`}
                  placeholder="Descripción (opcional)"
                />
              </div>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <label className="flex-1">
                <span className="text-[11px] font-semibold text-gray-400">Valor (€)</span>
                <input name="value" defaultValue={eurosInput(t.valueCents)} inputMode="decimal" className={inputCls} />
              </label>
              <label className="flex-1">
                <span className="text-[11px] font-semibold text-gray-400">Veces/semana</span>
                <input name="weeklyTarget" type="number" min={1} max={31} defaultValue={t.weeklyTarget} className={inputCls} />
              </label>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <SubmitButton className="tap-bounce rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
                Guardar
              </SubmitButton>
              <ToggleActive id={t.id} active={t.active} />
            </div>
          </form>
        ))}
      </div>

      {/* Añadir tarea */}
      <h2 className="px-4 pt-6 font-display text-lg font-bold text-indigo-800">➕ Nueva tarea</h2>
      <form action={addTask} className="mx-3 mt-2 rounded-3xl bg-white/90 p-3 shadow-md">
        <div className="flex gap-3">
          <EmojiInput name="icon" defaultValue="⭐" suggestions={TASK_ICONS} />
          <div className="flex-1">
            <input name="name" placeholder="Nombre de la tarea" className={`${inputCls} font-display font-bold`} required />
            <input name="description" placeholder="Descripción (opcional)" className={`${inputCls} mt-1.5`} />
          </div>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <label className="flex-1">
            <span className="text-[11px] font-semibold text-gray-400">Valor (€)</span>
            <input name="value" defaultValue="1" inputMode="decimal" className={inputCls} />
          </label>
          <label className="flex-1">
            <span className="text-[11px] font-semibold text-gray-400">Veces/semana</span>
            <input name="weeklyTarget" type="number" min={1} max={31} defaultValue={7} className={inputCls} />
          </label>
        </div>
        <SubmitButton className="tap-bounce mt-3 w-full rounded-xl bg-emerald-600 py-2 font-display text-sm font-bold text-white">
          Añadir tarea
        </SubmitButton>
      </form>

      {/* Hijos */}
      <h2 className="px-4 pt-6 font-display text-lg font-bold text-indigo-800">🧒 Hijos</h2>
      <div className="mx-3 mt-2 space-y-2.5">
        {kids.map((k) => (
          <form key={k.id} action={updateKid} className="flex items-center gap-2 rounded-3xl bg-white/90 p-3 shadow-md">
            <input type="hidden" name="id" value={k.id} />
            <EmojiInput name="emoji" defaultValue={k.emoji} suggestions={KID_EMOJIS} />
            <input name="name" defaultValue={k.name} className={`${inputCls} flex-1 font-display font-bold`} />
            <SubmitButton className="tap-bounce shrink-0 rounded-xl bg-indigo-600 px-3 py-1.5 font-display text-sm font-bold text-white">
              Guardar
            </SubmitButton>
          </form>
        ))}

        <form action={addKid} className="rounded-3xl bg-white/90 p-3 shadow-md">
          <div className="flex items-center gap-2">
            <EmojiInput name="emoji" defaultValue="🙂" suggestions={KID_EMOJIS} />
            <input name="name" placeholder="Nombre del hijo" className={`${inputCls} flex-1`} required />
            <SubmitButton className="tap-bounce shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 font-display text-sm font-bold text-white">
              Añadir
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}

function ToggleActive({ id, active }: { id: number; active: boolean }) {
  return (
    <form action={setTaskActive}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? '0' : '1'} />
      <SubmitButton className="rounded-xl border-2 border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-500">
        {active ? 'Ocultar' : 'Activar'}
      </SubmitButton>
    </form>
  )
}
