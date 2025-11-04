import { describe, expect, test } from 'bun:test';

import {
  collectTrustedOrigins,
  DEFAULT_BETTER_AUTH_BASE_PATH,
  isAuthRequestPath,
  normalizeBasePath,
} from '../auth/utils';

describe('normalizeBasePath', () => {
  test('ensures a leading slash is present', () => {
    expect(normalizeBasePath('auth')).toBe('/auth');
  });

  test('deduplicates trailing slash', () => {
    expect(normalizeBasePath('/api/auth/')).toBe('/api/auth');
  });

  test('collapses duplicate leading slashes', () => {
    expect(normalizeBasePath('//api/auth')).toBe('/api/auth');
  });

  test('falls back to default when value is empty', () => {
    expect(normalizeBasePath('')).toBe(DEFAULT_BETTER_AUTH_BASE_PATH);
  });
});

describe('collectTrustedOrigins', () => {
  test('includes the base URL origin when provided', () => {
    const origins = collectTrustedOrigins(undefined, 'https://example.com');
    expect(origins).toEqual(['https://example.com']);
  });

  test('deduplicates entries and trims whitespace', () => {
    const origins = collectTrustedOrigins('https://a.com, https://a.com ,http://b.com', undefined);
    expect(origins).toEqual(['https://a.com', 'http://b.com']);
  });

  test('falls back to trimmed value if origin cannot be parsed', () => {
    const origins = collectTrustedOrigins('invalid-origin', undefined);
    expect(origins).toEqual(['invalid-origin']);
  });
});

describe('isAuthRequestPath', () => {
  const basePath = '/api/auth';

  test('matches the base path exactly', () => {
    expect(isAuthRequestPath('/api/auth', basePath)).toBe(true);
  });

  test('matches nested routes', () => {
    expect(isAuthRequestPath('/api/auth/callback', basePath)).toBe(true);
  });

  test('matches base path with trailing slash', () => {
    expect(isAuthRequestPath('/api/auth/', basePath)).toBe(true);
  });

  test('rejects similar prefixes', () => {
    expect(isAuthRequestPath('/api/authentication', basePath)).toBe(false);
  });

  test('rejects unrelated paths', () => {
    expect(isAuthRequestPath('/api/trips', basePath)).toBe(false);
  });
});
