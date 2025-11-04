import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '../db/client';

const authSecret = process.env.BETTER_AUTH_SECRET;

if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET must be set');
}

export const auth = betterAuth({
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
});
