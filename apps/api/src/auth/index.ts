import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '../db/client';
import {
  collectTrustedOrigins,
  DEFAULT_BETTER_AUTH_BASE_PATH,
  normalizeBasePath,
} from './utils';

const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error('BETTER_AUTH_SECRET or AUTH_SECRET must be set');
}

const baseUrlEnv = process.env.BETTER_AUTH_URL ?? process.env.API_BASE_URL;
const baseURL = baseUrlEnv?.trim() ? baseUrlEnv.trim() : undefined;

export const AUTH_BASE_PATH = normalizeBasePath(
  process.env.BETTER_AUTH_BASE_PATH ?? DEFAULT_BETTER_AUTH_BASE_PATH,
);

if (AUTH_BASE_PATH === '/') {
  throw new Error('BETTER_AUTH_BASE_PATH cannot be set to "/"');
}

const trustedOrigins = collectTrustedOrigins(process.env.BETTER_AUTH_TRUSTED_ORIGINS, baseURL);
const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

type AuthEmailPurpose = 'verification' | 'reset-password';
type SendAuthEmailPayload = {
  user: { email?: string | null };
  url: string;
  token: string;
};

const sendAuthEmail = async (purpose: AuthEmailPurpose, payload: SendAuthEmailPayload) => {
  const email = payload.user.email;

  if (!email) {
    return;
  }

  if (isProduction) {
    console.warn(
      `[auth:${purpose}] Email provider not configured. Attempted to send email to ${email}.`,
    );
    return;
  }

  console.info(`[auth:${purpose}] ${email} -> ${payload.url}`);
};

const authConfig = {
  secret: authSecret,
  basePath: AUTH_BASE_PATH,
  ...(baseURL ? { baseURL } : {}),
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  ...(trustedOrigins.length ? { trustedOrigins } : {}),
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async (data: SendAuthEmailPayload) =>
      sendAuthEmail('verification', data),
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    autoSignIn: true,
    sendResetPassword: async (data: SendAuthEmailPayload) =>
      sendAuthEmail('reset-password', data),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 6,
  },
} satisfies Parameters<typeof betterAuth>[0];

export const auth = betterAuth(authConfig);
