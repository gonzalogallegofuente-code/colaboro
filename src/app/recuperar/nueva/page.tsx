import Link from 'next/link'
import { resetPassword } from '@/app/actions'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

const inputCls =
  'mt-1 w-full rounded-2xl border-2 border-indigo-100 px-4 py-3 outline-none focus:border-indigo-500'

export default async function NuevaPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; e?: string }>
}) {
  const sp = await searchParams
  const token = sp.t && /^[0-9a-f]{64}$/.test(sp.t) ? sp.t : null

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center px-6">
      <div className="mb-6 text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--head)]">
          Contraseña nueva
        </h1>
      </div>

      {!token ? (
        <div className="w-full rounded-3xl bg-[var(--card)] p-5 text-center shadow-xl">
          <p className="text-sm font-semibold text-[var(--ink-2)]">
            El enlace no es válido.{' '}
            <Link href="/recuperar" className="font-bold text-indigo-600 underline">
              Pide uno nuevo
            </Link>
            .
          </p>
        </div>
      ) : (
        <form action={resetPassword} className="w-full rounded-3xl bg-[var(--card)] p-5 shadow-xl">
          <input type="hidden" name="token" value={token} />
          <label className="font-display text-sm font-bold text-[var(--ink-2)]">
            Nueva contraseña (mín. 6)
            <input name="password" type="password" autoComplete="new-password" minLength={6} autoFocus className={inputCls} required />
          </label>
          {sp.e === 'short' && (
            <p className="mt-2 text-center text-sm font-semibold text-red-600">Debe tener al menos 6 caracteres</p>
          )}
          <SubmitButton className="tap-bounce mt-4 w-full rounded-2xl bg-emerald-600 py-3 font-display text-lg font-bold text-white">
            Guardar y entrar ✔
          </SubmitButton>
          <p className="mt-3 text-center text-[11px] font-semibold text-[var(--ink-3)]">
            Al guardar entrarás directamente; las sesiones antiguas se cierran solas.
          </p>
        </form>
      )}
    </main>
  )
}
