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

// Check if we're in production (cross-origin scenario)
const cookieDomain = resolveCookieDomain();
const enableCrossSubDomain = !!cookieDomain;

export const auth = betterAuth({
  appName: "Admin Panel",
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.admin,
      session: schema.adminSession,
      account: schema.adminAccount,
      verification: schema.adminVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
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
    generateId: false, // Use our own UUID generation
  },
  user: {
    additionalFields: {
      roleId: {
        type: "string",
        required: false,
        input: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: false,
      },
    },
  },
});

export type Auth = typeof auth;
