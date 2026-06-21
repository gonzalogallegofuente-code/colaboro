import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'

// Los hijos (Leo, Eliot…). Se pueden añadir más.
export const kids = pgTable('kids', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('🙂'),
  avatarUrl: text('avatar_url'),
  color: text('color').notNull().default('#2563eb'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Las tareas y su valor. weekly_target = nº de veces esperadas por semana
// (las casillas de la hoja de papel).
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull().default('⭐'),
  valueCents: integer('value_cents').notNull().default(100),
  weeklyTarget: integer('weekly_target').notNull().default(7),
  color: text('color').notNull().default('#e9d5ff'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Cada vez que un hijo hace una tarea. done_on = el día al que se imputa
// (puede ser ayer u otro día anterior). value_cents = foto del valor al marcar.
export const completions = pgTable(
  'completions',
  {
    id: serial('id').primaryKey(),
    kidId: integer('kid_id')
      .notNull()
      .references(() => kids.id, { onDelete: 'cascade' }),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'restrict' }),
    doneOn: date('done_on').notNull(),
    valueCents: integer('value_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('completions_kid_date_idx').on(t.kidId, t.doneOn)],
)

// Liquidaciones: cuando se paga lo acumulado queda registrado aquí.
// saldo de un hijo = sum(completions.value) - sum(payouts.amount).
export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  kidId: integer('kid_id')
    .notNull()
    .references(() => kids.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  note: text('note'),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
})

// Ajustes globales clave-valor (p.ej. unit = 'eur' | 'pts').
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

// Recompensas que la familia rellena (canjeables por puntos/€).
export const rewards = pgTable('rewards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('🎁'),
  costCents: integer('cost_cents').notNull().default(500),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Canje: un hijo cambia su saldo por una recompensa (resta del saldo).
// Guardamos nombre/icono/coste como foto por si luego se borra la recompensa.
export const redemptions = pgTable('redemptions', {
  id: serial('id').primaryKey(),
  kidId: integer('kid_id')
    .notNull()
    .references(() => kids.id, { onDelete: 'cascade' }),
  rewardId: integer('reward_id').references(() => rewards.id, { onDelete: 'set null' }),
  rewardName: text('reward_name').notNull(),
  rewardIcon: text('reward_icon').notNull().default('🎁'),
  costCents: integer('cost_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Kid = typeof kids.$inferSelect
export type Task = typeof tasks.$inferSelect
export type Completion = typeof completions.$inferSelect
export type Payout = typeof payouts.$inferSelect
export type Reward = typeof rewards.$inferSelect
export type Redemption = typeof redemptions.$inferSelect
