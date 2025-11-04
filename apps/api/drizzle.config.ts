import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';


const DATABASE_URL = process.env.MIGRATIONS_DB_URL!;
if (!DATABASE_URL) {
  throw new Error('MIGRATIONS_DB_URL must be set for drizzle-kit');
}

export default defineConfig({
    out: './src/db/migrations',
    schema: './src/db/schemas/index.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: DATABASE_URL,
    }
})