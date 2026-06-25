import { and, eq } from 'drizzle-orm'
import { db } from './db'
import { settings } from './db/schema'

export type Unit = 'eur' | 'pts'
export type MoneyConfig = { unit: Unit; pointsName: string; pointsIcon: string }
export type Theme = 'infantil' | 'juvenil'

export async function getMoneyConfig(accountId: number): Promise<MoneyConfig> {
  const rows = await db.select().from(settings).where(eq(settings.accountId, accountId))
  const map = new Map(rows.map((r) => [r.key, r.value]))
  return {
    unit: map.get('unit') === 'pts' ? 'pts' : 'eur',
    pointsName: (map.get('points_name') || 'gemas').trim() || 'gemas',
    pointsIcon: (map.get('points_icon') || '💎').trim() || '💎',
  }
}

export async function getTheme(accountId: number): Promise<Theme> {
  const [row] = await db
    .select()
    .from(settings)
    .where(and(eq(settings.accountId, accountId), eq(settings.key, 'theme')))
  return row?.value === 'juvenil' ? 'juvenil' : 'infantil'
}

export async function setSetting(accountId: number, key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ accountId, key, value })
    .onConflictDoUpdate({ target: [settings.accountId, settings.key], set: { value } })
}

export async function setUnitValue(accountId: number, unit: Unit): Promise<void> {
  await setSetting(accountId, 'unit', unit)
}

export async function seedDefaultSettings(accountId: number): Promise<void> {
  const defaults: [string, string][] = [
    ['unit', 'eur'],
    ['points_name', 'gemas'],
    ['points_icon', '💎'],
    ['theme', 'infantil'],
  ]
  for (const [key, value] of defaults) {
    await db.insert(settings).values({ accountId, key, value }).onConflictDoNothing()
  }
}
