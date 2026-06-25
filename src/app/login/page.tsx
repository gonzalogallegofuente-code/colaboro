import Link from 'next/link'
import { login } from '@/app/actions'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

const inputCls =
  'mt-1 w-full rounded-2xl border-2 border-indigo-100 px-4 py-3 outline-none focus:border-indigo-500'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center px-6">
      <div className="mb-6 text-center">
        <div className="text-6xl">🦁🦊</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--head)]">Colaboro</h1>
        <p className="mt-1 font-display font-semibold text-[var(--ink-2)]">¡Gana premios ayudando en casa! 🪙</p>
      </div>
      <form action={login} className="w-full rounded-3xl bg-[var(--card)] p-5 shadow-xl">
        <label className="font-display text-sm font-bold text-[var(--ink-2)]">
          Email
          <input name="email" type="email" autoComplete="email" autoFocus className={inputCls} />
        </label>
        <label className="mt-3 block font-display text-sm font-bold text-[var(--ink-2)]">
          Contraseña
          <input name="password" type="password" autoComplete="current-password" className={inputCls} />
        </label>
        {e && <p className="mt-2 text-center text-sm font-semibold text-red-600">Email o contraseña incorrectos 🙈</p>}
        <SubmitButton className="tap-bounce mt-4 w-full rounded-2xl bg-indigo-600 py-3 font-display text-lg font-bold text-white">
          Entrar 🚀
        </SubmitButton>
      </form>
      <p className="mt-4 text-sm font-semibold text-[var(--ink-2)]">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-bold text-indigo-600 underline">
          Regístrate
        </Link>
      </p>
    </main>
  )
}
