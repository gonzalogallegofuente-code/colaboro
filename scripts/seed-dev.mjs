// Semilla mínima en colaboro_dev para probar la UI en local: cuenta de prueba
// (dev@test.local / colaboro-dev-2026) + 2 hijos (uno infantil, otro juvenil)
// con tareas y recompensas típicas. Idempotente a nivel de cuenta.
//   DATABASE_URL=... node scripts/seed-dev.mjs   (¡NUNCA contra la BD real!)
import { randomBytes, scryptSync } from 'node:crypto'
import postgres from 'postgres'

if (!/colaboro_dev/.test(process.env.DATABASE_URL ?? '')) {
  console.error('Rechazado: DATABASE_URL no apunta a colaboro_dev')
  process.exit(1)
}
const sql = postgres(process.env.DATABASE_URL, { max: 1 })

function hashPassword(pw) {
  const salt = randomBytes(16)
  const key = scryptSync(pw, salt, 64)
  return `${salt.toString('hex')}:${key.toString('hex')}`
}

const email = 'dev@test.local'
const pass = 'colaboro-dev-2026'

const [acc] = await sql`
  insert into accounts (email, password_hash)
  values (${email}, ${hashPassword(pass)})
  on conflict (email) do update set password_hash = excluded.password_hash
  returning id`
console.log('cuenta', acc.id, email, '/', pass)

const kidRows = await sql`select id, name from kids where account_id = ${acc.id}`
if (kidRows.length === 0) {
  const [peque] = await sql`insert into kids (account_id, name, emoji, color, theme, sort_order)
    values (${acc.id}, 'Peque', '🦁', '#f59e0b', 'infantil', 1) returning id`
  const [teen] = await sql`insert into kids (account_id, name, emoji, color, theme, sort_order)
    values (${acc.id}, 'Teen', '🦊', '#8b5cf6', 'juvenil', 2) returning id`
  const tareas = [
    ['Hacer la cama', '🛏️', 'bed'],
    ['Poner la mesa', '🍽️', 'fork-knife'],
    ['Aspirar el salón', '✨', null],
    ['Lavarse los dientes', '🦷', 'tooth'],
    ['Leer 20 minutos', '📖', 'book'],
    ['Sacar la basura', '🗑️', 'trash'],
  ]
  for (const kid of [peque, teen]) {
    let i = 0
    for (const [name, icon, key] of tareas) {
      await sql`insert into tasks (account_id, kid_id, name, icon, icon_key, value_cents, weekly_target, color, sort_order)
        values (${acc.id}, ${kid.id}, ${name}, ${icon}, ${key}, 50, 7, '#e9d5ff', ${++i})`
    }
    await sql`insert into rewards (account_id, kid_id, name, icon, icon_key, cost_cents, sort_order)
      values (${acc.id}, ${kid.id}, 'Helado', '🍨', 'helado', 300, 1),
             (${acc.id}, ${kid.id}, 'Media hora de videojuegos', '🎮', 'videojuego', 200, 2),
             (${acc.id}, ${kid.id}, 'Peli en familia', '🎬', 'cine', 500, 3)`
  }
  console.log('hijos + tareas + recompensas creados')
} else {
  console.log('ya había hijos:', kidRows.map((k) => k.name).join(', '))
}
await sql.end()
