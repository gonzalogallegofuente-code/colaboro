const fmt = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

// 100 -> "1,00 €" ; 50 -> "0,50 €"
export function euros(cents: number): string {
  return fmt.format((cents ?? 0) / 100)
}

export type Unit = 'eur' | 'pts'

const ptsFmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })

// Importe formateado según la unidad: "1,00 €" o "5 pts".
export function formatAmount(cents: number, unit: Unit): string {
  if (unit === 'pts') return `${ptsFmt.format((cents ?? 0) / 100)} pts`
  return euros(cents)
}

export function unitIcon(unit: Unit): string {
  return unit === 'pts' ? '⭐' : '🪙'
}

export function unitWord(unit: Unit): string {
  return unit === 'pts' ? 'puntos' : '€'
}

// "1,5" / "1" -> 150 (céntimos). Acepta coma o punto.
export function parseEurosToCents(input: string): number | null {
  const cleaned = String(input).trim().replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
