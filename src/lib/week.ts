// Utilidades de fecha. Las semanas van de SÁBADO a VIERNES.
// Trabajamos con cadenas 'YYYY-MM-DD' para casar con la columna `date` de Postgres.

export function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export function todayYmd(): string {
  return ymd(new Date())
}

// Sábado (inicio) de la semana que contiene a `d`.
export function weekStartOf(d: Date): Date {
  const day = d.getDay() // 0 dom … 6 sáb
  const diff = (day - 6 + 7) % 7 // días transcurridos desde el sábado
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff)
}

// Rango sáb–vie (cadenas) de la semana que contiene a la fecha `s` (YYYY-MM-DD).
export function weekRange(s: string): { start: string; end: string } {
  const start = weekStartOf(parseYmd(s))
  const end = addDays(start, 6)
  return { start: ymd(start), end: ymd(end) }
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// "7 – 13 jun 2026" (compacto si es el mismo mes/año)
export function formatRange(startYmd: string, endYmd: string): string {
  const a = parseYmd(startYmd)
  const b = parseYmd(endYmd)
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  if (sameMonth) {
    return `${a.getDate()}–${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`
  }
  const sameYear = a.getFullYear() === b.getFullYear()
  const left = `${a.getDate()} ${MESES[a.getMonth()]}${sameYear ? '' : ' ' + a.getFullYear()}`
  const right = `${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`
  return `${left} – ${right}`
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

// "sáb 21 jun"
export function formatDay(s: string): string {
  const d = parseYmd(s)
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}

// Etiqueta amable relativa a hoy: Hoy / Ayer / "sáb 21 jun".
export function friendlyDay(s: string): string {
  const today = todayYmd()
  if (s === today) return 'Hoy'
  if (s === ymd(addDays(new Date(), -1))) return 'Ayer'
  return formatDay(s)
}

const DOW2 = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá']

// Los 7 días de la semana (sáb→vie) que empieza en `startYmd`.
export function weekDays(startYmd: string): { ymd: string; dow: string; dom: number }[] {
  const start = parseYmd(startYmd)
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i)
    return { ymd: ymd(d), dow: DOW2[d.getDay()], dom: d.getDate() }
  })
}

// Sábado de la semana anterior / siguiente a la que contiene `anyDate`.
export function shiftWeek(anyDate: string, weeks: number): string {
  const start = weekStartOf(parseYmd(anyDate))
  return ymd(addDays(start, weeks * 7))
}
