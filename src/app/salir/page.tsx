import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireViewerPage } from '@/lib/session'
import { exitKidMode } from '@/app/actions'
import { ThemeShell } from '@/components/ThemeShell'
import { SubmitButton } from '@/components/SubmitButton'
import { ExitWithFingerprint } from '@/components/ExitWithFingerprint'

export const dynamic = 'force-dynamic'

export default async function SalirPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams
  const viewer = await requireViewerPage()
  if (!viewer.isKid) redirect('/') // solo tiene sentido en modo niño

  return (
    <ThemeShell theme="infantil">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
        <h1 className="text-center font-display text-2xl font-bold text-[var(--head)]">🔒 Salir del modo niño</h1>
        <p className="mt-1 text-center text-sm font-semibold text-[var(--ink-3)]">
          Usa tu huella o la contraseña de la cuenta para volver al panel de los padres.
        </p>
        {sp.e === 'bad' && (
          <p className="mt-3 rounded-2xl bg-rose-100 px-3 py-2 text-center text-sm font-bold text-rose-600">
            Contraseña incorrecta, inténtalo otra vez.
          </p>
        )}

        <div className="mt-6">
          <ExitWithFingerprint />
        </div>

        <div className="my-4 flex items-center gap-3 text-[11px] font-bold text-[var(--ink-3)]">
          <span className="h-px flex-1 bg-gray-200" />o con la contraseña<span className="h-px flex-1 bg-gray-200" />
        </div>

        <form action={exitKidMode} className="space-y-3">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña de los padres"
            className="w-full rounded-xl border-2 border-indigo-100 px-3 py-2 text-center text-lg outline-none focus:border-indigo-500"
            required
          />
          <SubmitButton className="tap-bounce w-full rounded-xl bg-indigo-600 py-2.5 font-display text-base font-bold text-white">
            Salir 🔓
          </SubmitButton>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-bold text-[var(--ink-3)]">
            ← Seguir en modo niño
          </Link>
        </div>
      </div>
    </ThemeShell>
  )
}
