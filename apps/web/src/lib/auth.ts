import { authClient } from "@/lib/auth-client";

export async function getSession() {
  try {
    const session = await authClient.getSession();
    return session.data;
  } catch {
    return null;
  }
}
