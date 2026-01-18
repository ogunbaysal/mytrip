import { createAuthClient } from "better-auth/react";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tatildesen.comlocalhost:3002";

export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl}/api/auth`,
  fetchOptions: {
    credentials: "include", // Required for cross-origin cookie handling
  },
});

export const { signIn, signOut, useSession } = authClient;
