import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'

// Cuenta (una por familia). Cada cuenta está aislada de las demás.
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Los hijos de una cuenta.
export const kids = pgTable('kids', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('🙂'),
  avatarUrl: text('avatar_url'),
  color: text('color').notNull().default('#2563eb'),
  // Ajustes propios de cada hijo:
  theme: text('theme').notNull().default('infantil'),
  unit: text('unit').notNull().default('eur'),
  pointsName: text('points_name').notNull().default('gemas'),
  pointsIcon: text('points_icon').notNull().default('💎'),
  // Estilo de iconos de las tareas: 'emoji' | 'line' | 'fill'.
  iconStyle: text('icon_style').notNull().default('emoji'),
  // Meta de ahorro (opcional): un objetivo al que ahorrar.
  goalName: text('goal_name'),
  goalIcon: text('goal_icon'),
  goalCostCents: integer('goal_cost_cents'),
  // PIN opcional (4 dígitos) para el modo niño.
  pin: text('pin'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Tareas: ahora son PROPIAS de cada hijo (kid_id).
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  kidId: integer('kid_id')
    .notNull()
    .references(() => kids.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull().default('⭐'),
  // Clave del icono en el catálogo (icons.ts); permite estilos línea/relleno.
  iconKey: text('icon_key'),
  valueCents: integer('value_cents').notNull().default(100),
  weeklyTarget: integer('weekly_target').notNull().default(7),
  color: text('color').notNull().default('#e9d5ff'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const completions = pgTable(
  'completions',
  {
    id: serial('id').primaryKey(),
    kidId: integer('kid_id')
      .notNull()
      .references(() => kids.id, { onDelete: 'cascade' }),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    doneOn: date('done_on').notNull(),
    valueCents: integer('value_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('completions_kid_date_idx').on(t.kidId, t.doneOn)],
)

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  kidId: integer('kid_id')
    .notNull()
    .references(() => kids.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  note: text('note'),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
})

// Ajustes por cuenta (unit, points_name, points_icon, theme).
export const settings = pgTable(
  'settings',
  {
    accountId: integer('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: text('value').notNull(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.key] })],
)

// Recompensas: también PROPIAS de cada hijo (kid_id).
export const rewards = pgTable('rewards', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  kidId: integer('kid_id')
    .notNull()
    .references(() => kids.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('🎁'),
  // Clave del icono de recompensa (reward-icons.ts) para mostrar el dibujo.
  iconKey: text('icon_key'),
  costCents: integer('cost_cents').notNull().default(500),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

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

// Suscripciones de notificaciones push (por cuenta / dispositivo).
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Credenciales WebAuthn / passkeys (huella) por cuenta.
export const webauthnCredentials = pgTable('webauthn_credentials', {
  id: text('id').primaryKey(), // credential ID (base64url)
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(), // clave pública (base64url)
  counter: integer('counter').notNull().default(0),
  transports: text('transports'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Account = typeof accounts.$inferSelect
export type Kid = typeof kids.$inferSelect
export type Task = typeof tasks.$inferSelect
export type Completion = typeof completions.$inferSelect
export type Payout = typeof payouts.$inferSelect
export type Reward = typeof rewards.$inferSelect
export type Redemption = typeof redemptions.$inferSelect
