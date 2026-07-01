import { redirect } from 'next/navigation'
import { getActiveKids } from '@/lib/data'
import { requireViewerPage } from '@/lib/session'
import { enterKid } from '@/app/actions'
import { Nav } from '@/components/Nav'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

export default async function ModoPage() {
  const viewer = await requireViewerPage()
  if (viewer.isKid) redirect('/') // en modo niño no se cambia de hijo
  const kids = await getActiveKids(viewer.accountId)

  return (
    <ThemeShell theme="infantil">
      <div className="mx-auto max-w-md pb-12">
        <Nav active="modo" />

        <h1 className="px-4 pt-2 font-display text-xl font-bold text-[var(--head)]">📱 Modo niño</h1>
        <p className="px-4 text-xs font-semibold text-[var(--ink-3)]">
          Toca un hijo para abrirle su pantalla sencilla (solo sus tareas). Para volver a tu cuenta, pulsa 🏠 arriba.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 px-3">
          {kids.map((k) => (
            <form
              key={k.id}
              action={enterKid}
              className="rounded-3xl bg-[var(--card)] p-4 text-center shadow-md"
              style={{ borderTop: `5px solid ${k.color}` }}
            >
              <input type="hidden" name="kidId" value={k.id} />
              <Avatar emoji={k.emoji} avatarUrl={k.avatarUrl} name={k.name} size={64} className="mx-auto" />
              <div className="mt-1 font-display text-lg font-bold text-[var(--ink)]">{k.name}</div>
              <SubmitButton className="tap-bounce mt-2 w-full rounded-xl bg-indigo-600 py-2 font-display text-sm font-bold text-white">
                Abrir su pantalla →
              </SubmitButton>
            </form>
          ))}
        </div>
      </div>
    </ThemeShell>
  )
}
