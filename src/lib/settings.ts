import { eq } from 'drizzle-orm'
import { db } from './db'
import { settings } from './db/schema'

export type Unit = 'eur' | 'pts'

export async function getUnit(): Promise<Unit> {
  const [row] = await db.select().from(settings).where(eq(settings.key, 'unit'))
  return row?.value === 'pts' ? 'pts' : 'eur'
}

export async function setUnitValue(unit: Unit): Promise<void> {
  await db
    .insert(settings)
    .values({ key: 'unit', value: unit })
    .onConflictDoUpdate({ target: settings.key, set: { value: unit } })
}
