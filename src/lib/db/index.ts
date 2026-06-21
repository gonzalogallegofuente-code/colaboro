import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: postgres.Sql | undefined
}

// En dev reutilizamos el cliente entre hot-reloads para no agotar conexiones.
const client = global._pgClient ?? postgres(connectionString, { ssl: false, max: 5 })
if (process.env.NODE_ENV !== 'production') global._pgClient = client

export const db = drizzle(client, { schema })
