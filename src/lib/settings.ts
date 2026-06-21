import { eq } from 'drizzle-orm'
import { db } from './db'
import { settings } from './db/schema'

export type Unit = 'eur' | 'pts'
export type MoneyConfig = { unit: Unit; pointsName: string; pointsIcon: string }

export async function getMoneyConfig(): Promise<MoneyConfig> {
  const rows = await db.select().from(settings)
  const map = new Map(rows.map((r) => [r.key, r.value]))
  return {
    unit: map.get('unit') === 'pts' ? 'pts' : 'eur',
    pointsName: (map.get('points_name') || 'gemas').trim() || 'gemas',
    pointsIcon: (map.get('points_icon') || '💎').trim() || '💎',
  }
}

export async function getUnit(): Promise<Unit> {
  const [row] = await db.select().from(settings).where(eq(settings.key, 'unit'))
  return row?.value === 'pts' ? 'pts' : 'eur'
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
}

export async function setUnitValue(unit: Unit): Promise<void> {
  await setSetting('unit', unit)
}
