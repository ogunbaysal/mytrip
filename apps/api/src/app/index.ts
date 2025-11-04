import { Hono } from 'hono';

import { sessionMiddleware } from '../middlewares/session';
import { registerAuthRoutes } from '../routes/auth';
import { registerHealthRoutes } from '../routes/health';
import type { AppBindings } from './types';

export const createApp = () => {
  const app = new Hono<AppBindings>();

  app.use('*', sessionMiddleware);

  registerAuthRoutes(app);
  registerHealthRoutes(app);

  return app;
};
