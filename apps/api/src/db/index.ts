import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schemas"

const globalForDb = globalThis as unknown as {
  db?: NodePgDatabase<typeof schema>
  pool?: Pool
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check your .env file.")
}

const useSsl = process.env.DATABASE_SSL === "true"
const poolMax = Number(process.env.PGPOOL_MAX ?? 50)
const poolIdleMs = Number(process.env.PGPOOL_IDLE_MS ?? 30_000)
const poolConnTimeoutMs = Number(process.env.PGPOOL_CONN_TIMEOUT_MS ?? 5_000)

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: Number.isFinite(poolMax) ? poolMax : 50,
    idleTimeoutMillis: Number.isFinite(poolIdleMs) ? poolIdleMs : 30_000,
    connectionTimeoutMillis: Number.isFinite(poolConnTimeoutMs) ? poolConnTimeoutMs : 5_000,
  })

const db = globalForDb.db ?? drizzle(pool, { schema })

if (!globalForDb.pool) {
  globalForDb.pool = pool
}

if (!globalForDb.db) {
  globalForDb.db = db
}

export { db, pool, schema }
