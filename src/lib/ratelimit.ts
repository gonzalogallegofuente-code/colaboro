// Limitador de intentos sencillo en memoria (una instancia de servidor).
// Suficiente para frenar fuerza bruta en login / salida del modo niño.
const buckets = new Map<string, { n: number; resetAt: number }>()

// true = puede intentarlo; false = bloqueado hasta que pase la ventana.
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
  }
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { n: 1, resetAt: now + windowMs })
    return true
  }
  b.n++
  return b.n <= max
}

// Al acertar, se limpia el contador (los fallos previos no penalizan más).
export function rateClear(key: string) {
  buckets.delete(key)
}
