export function resolveCookieDomain() {
  const envDomain = process.env.COOKIE_DOMAIN?.trim();
  if (envDomain) {
    return envDomain;
  }

  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }

  const authUrl = process.env.BETTER_AUTH_URL;
  if (!authUrl) {
    return undefined;
  }

  try {
    const hostname = new URL(authUrl).hostname;
    if (
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost")
    ) {
      return undefined;
    }

    const parts = hostname.split(".");
    if (parts.length < 2) {
      return undefined;
    }

    return `.${parts.slice(-2).join(".")}`;
  } catch {
    return undefined;
  }
}
