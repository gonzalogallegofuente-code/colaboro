'use client'

// Pantalla de error amigable: sustituye al "Application error" genérico de
// Next. Muestra el código (digest) y cómo avisarnos si el fallo persiste.
const SOPORTE = 'gonzalo.gallego.fuente@gmail.com'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const codigo = error.digest ?? 'sin código'
  const mailto = `mailto:${SOPORTE}?subject=${encodeURIComponent('Fallo en Colaboro')}&body=${encodeURIComponent(
    `Hola, me falla Colaboro.\n\nCódigo del error: ${codigo}\nQué estaba haciendo: `,
  )}`
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl">😅</div>
      <h1 className="mt-3 font-display text-2xl font-bold text-[var(--head)]">Ups, algo ha fallado</h1>
      <p className="mt-2 text-sm font-semibold text-[var(--ink-2)]">
        No es culpa tuya. Prueba a reintentar; si sigue igual, escríbenos y lo arreglamos enseguida.
      </p>
      {error.digest && (
        <p className="mt-4 rounded-xl bg-black/5 px-3 py-2 text-xs font-bold text-[var(--ink-2)]">
          Código del error: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <button
        onClick={reset}
        className="tap-bounce mt-5 w-full rounded-2xl bg-indigo-600 py-3 font-display text-base font-bold text-white"
      >
        🔄 Reintentar
      </button>
      <a href={mailto} className="mt-3 w-full rounded-2xl border-2 border-indigo-200 py-2.5 font-display text-sm font-bold text-indigo-600">
        ✉️ Escribir al soporte
      </a>
      <a href="/" className="mt-4 text-xs font-bold text-[var(--ink-3)] underline underline-offset-2">
        ← Volver al inicio
      </a>
    </main>
  )
}
