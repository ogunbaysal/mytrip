import { Context } from "hono";

export type AdminContextUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string;
};

export function getAdminUserFromContext(c: Context): AdminContextUser | null {
  return (c.get as any)?.("adminUser") ?? null;
}
