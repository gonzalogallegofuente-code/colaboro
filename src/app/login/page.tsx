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
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Colaboro</h1>
        <p className="mt-1 text-sm text-gray-500">Tareas de casa</p>
      </div>
      <form action={login} className="w-full rounded-2xl bg-white p-5 shadow-sm">
        <label htmlFor="pin" className="text-sm font-medium text-gray-600">
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          className="mt-1 w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-gray-900"
        />
        {e && <p className="mt-2 text-sm text-red-600">PIN incorrecto</p>}
        <SubmitButton className="mt-4 w-full rounded-xl bg-gray-900 py-3 font-semibold text-white">
          Entrar
        </SubmitButton>
      </form>
    </main>
  )
}
