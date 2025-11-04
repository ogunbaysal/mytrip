import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import { schema } from './schemas';

const databaseUrl = process.env.DATABASE_URL ?? process.env.MIGRATIONS_DB_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or MIGRATIONS_DB_URL must be set');
}

const connection = postgres(databaseUrl, {
  max: 1,
});

export const db = drizzle(connection, { schema });

export type DatabaseClient = typeof db;
