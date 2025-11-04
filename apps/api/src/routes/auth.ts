import type { Hono } from 'hono';

import { auth } from '../auth';
import type { AppBindings } from '../app/types';

export const registerAuthRoutes = (app: Hono<AppBindings>) => {
  app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));
};
