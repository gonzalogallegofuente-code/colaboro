import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getActiveKids } from '@/lib/data'
import { requireViewerPage } from '@/lib/session'
import { enterKid } from '@/app/actions'
import { ThemeShell } from '@/components/ThemeShell'
import { Avatar } from '@/components/Avatar'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

export default async function ModoPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams
  const viewer = await requireViewerPage()
  if (viewer.isKid) redirect('/') // en modo niño no se cambia de hijo
  const isKid = viewer.isKid
  const kids = await getActiveKids(viewer.accountId)

  return (
    <ThemeShell theme="infantil">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
        <h1 className="text-center font-display text-2xl font-bold text-[var(--head)]">👋 ¿Quién eres?</h1>
        <p className="mt-1 text-center text-sm font-semibold text-[var(--ink-3)]">
          Toca tu foto para ver y apuntar tus tareas.
        </p>
        {sp.e === 'pin' && (
          <p className="mt-3 rounded-2xl bg-rose-100 px-3 py-2 text-center text-sm font-bold text-rose-600">
            PIN incorrecto, inténtalo otra vez.
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
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
              {isKid && k.pin ? (
                <input
                  name="pin"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  placeholder="• • • •"
                  className="mt-2 w-full rounded-xl border-2 border-indigo-100 px-2 py-1.5 text-center text-lg font-bold tracking-[0.3em] outline-none focus:border-indigo-500"
                />
              ) : null}
              <SubmitButton className="tap-bounce mt-2 w-full rounded-xl bg-indigo-600 py-2 font-display text-sm font-bold text-white">
                {isKid && k.pin ? 'Entrar 🔓' : '¡Soy yo!'}
              </SubmitButton>
            </form>
          ))}
        </div>

        <div className="mt-auto pt-10 text-center">
          {isKid ? (
            <Link href="/salir" className="text-sm font-bold text-[var(--ink-3)]">
              🚪 Salir del modo niño
            </Link>
          ) : (
            <Link href="/" className="text-sm font-bold text-[var(--ink-3)]">
              ← Volver
            </Link>
          )}
        </div>
      </div>
    </ThemeShell>
  )
}
