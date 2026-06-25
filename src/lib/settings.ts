// Tipos de configuración. Desde 2026-06-25 el tema/unidad/puntos son POR HIJO
// (columnas en la tabla `kids`), no por cuenta.
export type Unit = 'eur' | 'pts'
export type MoneyConfig = { unit: Unit; pointsName: string; pointsIcon: string }
export type Theme = 'infantil' | 'juvenil'
