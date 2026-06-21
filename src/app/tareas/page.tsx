import { getAllTasks, getActiveKids } from '@/lib/data'
import { addKid, addTask, setTaskActive, updateTask } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

function eurosInput(cents: number): string {
  return (cents / 100).toString().replace('.', ',')
}

export default async function TareasPage() {
  const [tasks, kids] = await Promise.all([getAllTasks(), getActiveKids()])

  const inputCls = 'w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:border-gray-900'

  return (
    <div className="mx-auto max-w-md pb-12">
      <Nav active="tareas" />

      <h1 className="px-4 pt-2 text-lg font-bold text-gray-800">Tareas</h1>
      <p className="px-4 text-xs text-gray-400">
        Cambia el nombre, el valor (€) o las veces por semana. «Ocultar» la quita del tablero sin
        borrar lo apuntado.
      </p>

      <div className="mx-3 mt-3 space-y-2">
        {tasks.map((t) => (
          <form
            key={t.id}
            action={updateTask}
            className={`rounded-2xl bg-white p-3 shadow-sm ${t.active ? '' : 'opacity-60'}`}
            style={{ borderLeft: `6px solid ${t.color}` }}
          >
            <input type="hidden" name="id" value={t.id} />
            <input
              name="name"
              defaultValue={t.name}
              className={`${inputCls} font-semibold`}
              placeholder="Nombre"
            />
            <input
              name="description"
              defaultValue={t.description ?? ''}
              className={`${inputCls} mt-1.5 text-gray-500`}
              placeholder="Descripción (opcional)"
            />
            <div className="mt-2 flex items-end gap-2">
              <label className="flex-1">
                <span className="text-[11px] text-gray-400">Valor (€)</span>
                <input
                  name="value"
                  defaultValue={eurosInput(t.valueCents)}
                  inputMode="decimal"
                  className={inputCls}
                />
              </label>
              <label className="flex-1">
                <span className="text-[11px] text-gray-400">Veces/semana</span>
                <input
                  name="weeklyTarget"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue={t.weeklyTarget}
                  className={inputCls}
                />
              </label>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <SubmitButton className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">
                Guardar
              </SubmitButton>
              <ToggleActive id={t.id} active={t.active} />
            </div>
          </form>
        ))}
      </div>

      {/* Añadir tarea */}
      <h2 className="px-4 pt-6 text-base font-bold text-gray-800">Añadir tarea</h2>
      <form action={addTask} className="mx-3 mt-2 rounded-2xl bg-white p-3 shadow-sm">
        <input name="name" placeholder="Nombre de la tarea" className={`${inputCls} font-semibold`} required />
        <input name="description" placeholder="Descripción (opcional)" className={`${inputCls} mt-1.5`} />
        <div className="mt-2 flex items-end gap-2">
          <label className="flex-1">
            <span className="text-[11px] text-gray-400">Valor (€)</span>
            <input name="value" defaultValue="1" inputMode="decimal" className={inputCls} />
          </label>
          <label className="flex-1">
            <span className="text-[11px] text-gray-400">Veces/semana</span>
            <input name="weeklyTarget" type="number" min={1} max={31} defaultValue={7} className={inputCls} />
          </label>
        </div>
        <SubmitButton className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white">
          Añadir tarea
        </SubmitButton>
      </form>

      {/* Hijos */}
      <h2 className="px-4 pt-6 text-base font-bold text-gray-800">Hijos</h2>
      <div className="mx-3 mt-2 rounded-2xl bg-white p-3 shadow-sm">
        <div className="mb-2 flex flex-wrap gap-2">
          {kids.map((k) => (
            <span
              key={k.id}
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: `${k.color}1a`, color: k.color }}
            >
              {k.name}
            </span>
          ))}
        </div>
        <form action={addKid} className="flex gap-2">
          <input name="name" placeholder="Nombre del hijo" className={inputCls} required />
          <SubmitButton className="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">
            Añadir
          </SubmitButton>
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
      <SubmitButton className="rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-600">
        {active ? 'Ocultar' : 'Activar'}
      </SubmitButton>
    </form>
  )
}
