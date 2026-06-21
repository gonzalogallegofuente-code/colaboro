const fmt = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

// 100 -> "1,00 €" ; 50 -> "0,50 €"
export function euros(cents: number): string {
  return fmt.format((cents ?? 0) / 100)
}

// "1,5" / "1" -> 150 (céntimos). Acepta coma o punto.
export function parseEurosToCents(input: string): number | null {
  const cleaned = String(input).trim().replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
