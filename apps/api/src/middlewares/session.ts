import type { MiddlewareHandler } from 'hono';

import { AUTH_BASE_PATH, auth } from '../auth';
import type { AppBindings } from '../app/types';
import { isAuthRequestPath } from '../auth/utils';

export const sessionMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  if (isAuthRequestPath(c.req.path, AUTH_BASE_PATH)) {
    await next();
    return;
  }

  const sessionResult = await auth.api.getSession({
    headers: c.req.raw.headers,
    returnHeaders: true,
  });

  const sessionData = sessionResult?.response ?? null;

  if (sessionResult && 'headers' in sessionResult && sessionResult.headers) {
    sessionResult.headers.forEach((value, key) => {
      const append = key.toLowerCase() === 'set-cookie';
      c.header(key, value, append ? { append: true } : undefined);
    });
  }

  c.set('user', sessionData?.user ?? null);
  c.set('session', sessionData?.session ?? null);

  await next();
};
