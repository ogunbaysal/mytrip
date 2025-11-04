import type { Handler, Hono } from 'hono';

import { AUTH_BASE_PATH, auth } from '../auth';
import type { AppBindings } from '../app/types';

const AUTH_HTTP_METHODS: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'> = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
];

const handleAuthRoute: Handler<AppBindings> = async (c) => auth.handler(c.req.raw);

export const registerAuthRoutes = (app: Hono<AppBindings>) => {
  const basePath = AUTH_BASE_PATH;
  const wildcardPath = `${basePath}/*`;
  const paths = new Set([basePath, `${basePath}/`, wildcardPath]);

  paths.forEach((path) => {
    if (path === '//' || path === '/*') {
      return;
    }

    app.on(AUTH_HTTP_METHODS, path, handleAuthRoute);
  });
};
