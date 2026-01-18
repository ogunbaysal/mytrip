import { createAuthClient } from "better-auth/react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.tatildesen.com";

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/web/auth`,
  fetchOptions: {
    credentials: "include",
  },
});

export async function refreshSession() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/refresh-session`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to refresh session");
    }

    const data = await response.json();

    // Refresh the session using better-auth's client
    await authClient.getSession({ fetchOptions: { cache: "no-store" } });

    return data;
  } catch (error) {
    console.error("Session refresh error:", error);
    throw error;
  }
}
