import { login } from '@/app/actions'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>
}) {
  const { e } = await searchParams
  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center px-6">
      <div className="mb-6 text-center">
        <div className="text-6xl">🦁🦊</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-indigo-700">Colaboro</h1>
        <p className="mt-1 font-display font-semibold text-indigo-900/60">¡Gana dinero ayudando en casa! 🪙</p>
      </div>
      <form action={login} className="w-full rounded-3xl bg-white/90 p-5 shadow-xl">
        <label htmlFor="pin" className="font-display text-sm font-bold text-gray-600">
          Tu PIN secreto 🔒
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          className="mt-1 w-full rounded-2xl border-2 border-indigo-100 px-4 py-3 text-center font-display text-3xl tracking-[0.4em] outline-none focus:border-indigo-500"
        />
        {e && <p className="mt-2 text-center text-sm font-semibold text-red-600">PIN incorrecto 🙈</p>}
        <SubmitButton className="tap-bounce mt-4 w-full rounded-2xl bg-indigo-600 py-3 font-display text-lg font-bold text-white shadow-md">
          ¡Entrar! 🚀
        </SubmitButton>
      </form>
    </main>
  )
}
