export type BadgeStats = { bestStreak: number; total: number; earnedUnits: number }
export type Badge = { id: string; icon: string; label: string; earned: boolean }

// Medallas calculadas a partir de las estadísticas del hijo.
export function computeBadges(s: BadgeStats): Badge[] {
  const def: [string, string, string, boolean][] = [
    ['first', '🌱', 'Primera tarea', s.total >= 1],
    ['t10', '💪', '10 tareas', s.total >= 10],
    ['t50', '🏅', '50 tareas', s.total >= 50],
    ['t100', '🦸', '100 tareas', s.total >= 100],
    ['t250', '🌟', '250 tareas', s.total >= 250],
    ['s3', '🔥', 'Racha de 3 días', s.bestStreak >= 3],
    ['s7', '🔥', 'Racha de 7 días', s.bestStreak >= 7],
    ['s14', '⚡', 'Racha de 14 días', s.bestStreak >= 14],
    ['s30', '💎', 'Racha de 30 días', s.bestStreak >= 30],
    ['e50', '🤑', '50 ganados', s.earnedUnits >= 50],
    ['e100', '👑', '100 ganados', s.earnedUnits >= 100],
  ]
  return def.map(([id, icon, label, earned]) => ({ id, icon, label, earned }))
}
