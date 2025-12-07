import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schemas";

export const auth = betterAuth({
  appName: "Admin Panel",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
  ],
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
  socialProviders: {
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
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