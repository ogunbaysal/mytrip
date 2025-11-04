import type { Hono } from 'hono';

import type { AppBindings } from '../app/types';

export const registerHealthRoutes = (app: Hono<AppBindings>) => {
  app.get('/', (c) => {
    const user = c.get('user');

    return c.json({
      healthy: true,
      authenticated: Boolean(user),
    });
  });
};
