import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.ts";
import * as schema from "../db/schemas/index.ts";
import { resolveCookieDomain } from "./cookie-domain.ts";

const trustedOrigins = process.env.ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

const cookieDomain = resolveCookieDomain();
const enableCrossSubDomain = !!cookieDomain;

export const webAuth = betterAuth({
  appName: "TatilDesen",
  baseURL: new URL(
    "/api/web/auth",
    process.env.BETTER_AUTH_URL || "http://localhost:3002",
  ).href,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  socialProviders: {},
  advanced: {
    crossSubDomainCookies: {
      enabled: enableCrossSubDomain,
      domain: cookieDomain,
    },
    generateId: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
      },
      subscriptionStatus: {
        type: "string",
        required: false,
        // No default - will be null until user subscribes
      },
      phone: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      avatar: {
        type: "string",
        required: false,
      },
    },
  },
});

export type WebAuth = typeof webAuth;
