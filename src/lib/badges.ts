export type BadgeStats = { bestStreak: number; total: number; earnedUnits: number }
export type BadgeMetric = 'tasks' | 'streak' | 'earned'
export type BadgeDef = {
  id?: number
  metric: BadgeMetric
  threshold: number
  icon: string
  label: string
  // Premio (céntimos/centi-puntos) que se abona al conseguirlo. 0 = sin premio.
  rewardCents?: number
}
export type Badge = { id: string; icon: string; label: string; earned: boolean; rewardCents: number }

// Medallas por defecto (si una cuenta no ha personalizado las suyas).
export const DEFAULT_BADGES: BadgeDef[] = [
  { metric: 'tasks', threshold: 1, icon: '🌱', label: 'Primera tarea' },
  { metric: 'tasks', threshold: 10, icon: '💪', label: '10 tareas' },
  { metric: 'tasks', threshold: 50, icon: '🏅', label: '50 tareas' },
  { metric: 'tasks', threshold: 100, icon: '🦸', label: '100 tareas' },
  { metric: 'tasks', threshold: 250, icon: '🌟', label: '250 tareas' },
  { metric: 'streak', threshold: 3, icon: '🔥', label: 'Racha de 3 días' },
  { metric: 'streak', threshold: 7, icon: '🔥', label: 'Racha de 7 días' },
  { metric: 'streak', threshold: 14, icon: '⚡', label: 'Racha de 14 días' },
  { metric: 'streak', threshold: 30, icon: '💎', label: 'Racha de 30 días' },
  { metric: 'earned', threshold: 50, icon: '🤑', label: '50 ganados' },
  { metric: 'earned', threshold: 100, icon: '👑', label: '100 ganados' },
]

export const METRIC_LABEL: Record<BadgeMetric, string> = {
  tasks: 'tareas hechas',
  streak: 'mejor racha (días)',
  earned: 'dinero/puntos ganados',
}

export function isMetric(m: string): m is BadgeMetric {
  return m === 'tasks' || m === 'streak' || m === 'earned'
}

export function metricValue(s: BadgeStats, metric: BadgeMetric): number {
  return metric === 'streak' ? s.bestStreak : metric === 'earned' ? s.earnedUnits : s.total
}

// Marca cada medalla como conseguida o no según las estadísticas del hijo.
export function computeBadges(defs: BadgeDef[], s: BadgeStats): Badge[] {
  return defs.map((d, i) => ({
    id: String(d.id ?? i),
    icon: d.icon,
    label: d.label,
    earned: metricValue(s, d.metric) >= d.threshold,
    rewardCents: d.rewardCents ?? 0,
  }))
}
