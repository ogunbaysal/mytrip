const DEFAULT_AUTH_BASE_PATH = '/api/auth';

const toOrigin = (value: string | undefined | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
};

export const normalizeBasePath = (value: string): string => {
  const trimmed = value.trim();
  const withLeading = trimmed ? (trimmed.startsWith('/') ? trimmed : `/${trimmed}`) : DEFAULT_AUTH_BASE_PATH;
  const singleLeading = withLeading === '/' ? withLeading : withLeading.replace(/^\/+/, '/');

  if (singleLeading === '/') {
    return singleLeading;
  }

  return singleLeading.endsWith('/') ? singleLeading.slice(0, -1) : singleLeading;
};

export const collectTrustedOrigins = (rawOrigins?: string, baseUrl?: string): string[] => {
  const origins = new Set<string>();

  const baseOrigin = toOrigin(baseUrl);
  if (baseOrigin) {
    origins.add(baseOrigin);
  }

  if (rawOrigins) {
    rawOrigins
      .split(',')
      .map((origin) => toOrigin(origin))
      .filter((origin): origin is string => Boolean(origin))
      .forEach((origin) => origins.add(origin));
  }

  return Array.from(origins);
};

export const isAuthRequestPath = (path: string, basePath: string): boolean => {
  const normalizedBasePath = normalizeBasePath(basePath);

  if (normalizedBasePath === '/') {
    return path === '/' || path.startsWith('/');
  }

  if (path === normalizedBasePath) {
    return true;
  }

  if (path === `${normalizedBasePath}/`) {
    return true;
  }

  return path.startsWith(`${normalizedBasePath}/`);
};

export const DEFAULT_BETTER_AUTH_BASE_PATH = DEFAULT_AUTH_BASE_PATH;
