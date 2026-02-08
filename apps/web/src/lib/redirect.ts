import type { Route } from "next"

export function resolveSafeRedirect(
  redirectValue: string | null | undefined,
  fallback: Route = "/" as Route,
): Route {
  if (!redirectValue) {
    return fallback
  }

  const value = redirectValue.trim()
  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback
  }

  return value as Route
}
