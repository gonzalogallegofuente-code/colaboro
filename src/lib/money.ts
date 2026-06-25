const fmt = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

// 100 -> "1,00 €" ; 50 -> "0,50 €"
export function euros(cents: number): string {
  return fmt.format((cents ?? 0) / 100)
}

import type { MoneyConfig, Theme } from './settings'

const ptsFmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })

// Config de dinero y tema a partir de la fila del hijo (tienen estos campos).
export function moneyOf(k: { unit: string; pointsName: string; pointsIcon: string }): MoneyConfig {
  return {
    unit: k.unit === 'pts' ? 'pts' : 'eur',
    pointsName: (k.pointsName || 'gemas').trim() || 'gemas',
    pointsIcon: (k.pointsIcon || '💎').trim() || '💎',
  }
}

export function themeOf(k: { theme: string }): Theme {
  return k.theme === 'juvenil' ? 'juvenil' : 'infantil'
}

// Singular castellano sencillo: "gemas" -> "gema", "pavos" -> "pavo".
function singular(name: string): string {
  return name.endsWith('s') ? name.slice(0, -1) : name
}

// Importe formateado: "1,00 €" o "5 gemas" / "1 gema" (con el nombre elegido).
export function formatAmount(cents: number, cfg: MoneyConfig): string {
  if (cfg.unit === 'pts') {
    const n = (cents ?? 0) / 100
    return `${ptsFmt.format(n)} ${n === 1 ? singular(cfg.pointsName) : cfg.pointsName}`
  }
  return euros(cents)
}

export function unitIcon(cfg: MoneyConfig): string {
  return cfg.unit === 'pts' ? cfg.pointsIcon : '🪙'
}

// Palabra de la unidad para etiquetas: "€" o el nombre de los puntos.
export function unitWord(cfg: MoneyConfig): string {
  return cfg.unit === 'pts' ? cfg.pointsName : '€'
}

// "1,5" / "1" -> 150 (céntimos). Acepta coma o punto.
export function parseEurosToCents(input: string): number | null {
  const cleaned = String(input).trim().replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
