import Link from 'next/link'
import { requestPasswordReset } from '@/app/actions'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

const inputCls =
  'mt-1 w-full rounded-2xl border-2 border-indigo-100 px-4 py-3 outline-none focus:border-indigo-500'

export default async function RecuperarPage({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const sp = await searchParams
  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center px-6">
      <div className="mb-6 text-center">
        <div className="text-6xl">🔑</div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--head)]">
          Recuperar contraseña
        </h1>
        <p className="mt-1 font-display font-semibold text-[var(--ink-2)]">
          Te enviaremos un enlace a tu email
        </p>
      </div>

      {sp.e === 'link' && (
        <p className="mb-3 w-full rounded-2xl bg-rose-100 px-3 py-2 text-center text-sm font-bold text-rose-600">
          Ese enlace ya no vale (caducó o ya se usó). Pide uno nuevo.
        </p>
      )}

      {sp.ok ? (
        <div className="w-full rounded-3xl bg-[var(--card)] p-5 text-center shadow-xl">
          <div className="text-4xl">📬</div>
          <p className="mt-2 text-sm font-semibold text-[var(--ink-2)]">
            Si ese email tiene cuenta, en un par de minutos recibirás un mensaje con el enlace para poner una
            contraseña nueva. <span className="font-bold text-[var(--ink)]">Mira también en spam.</span> El enlace
            caduca en 45 minutos.
          </p>
        </div>
      ) : (
        <form action={requestPasswordReset} className="w-full rounded-3xl bg-[var(--card)] p-5 shadow-xl">
          <label className="font-display text-sm font-bold text-[var(--ink-2)]">
            Email de tu cuenta
            <input name="email" type="email" autoComplete="email" autoFocus className={inputCls} required />
          </label>
          <SubmitButton className="tap-bounce mt-4 w-full rounded-2xl bg-indigo-600 py-3 font-display text-lg font-bold text-white">
            Enviarme el enlace 📩
          </SubmitButton>
        </form>
      )}

      <p className="mt-4 text-sm font-semibold text-[var(--ink-2)]">
        <Link href="/login" className="font-bold text-indigo-600 underline">
          ← Volver a entrar
        </Link>
      </p>
    </main>
  )
}
