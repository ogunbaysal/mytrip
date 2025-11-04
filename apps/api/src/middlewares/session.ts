import type { MiddlewareHandler } from 'hono';

import { auth } from '../auth';
import type { AppBindings } from '../app/types';

export const sessionMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  if (c.req.path.startsWith('/api/auth/')) {
    await next();
    return;
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set('user', session?.user ?? null);
  c.set('session', session?.session ?? null);

  await next();
};
