import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import authorizationRequestRoutes from './authorization-requests';
import authorizationRoutes from './authorizations';
import loginRoutes from './logins';
import namespaceRoutes from './namespaces';
import passwordResetRoutes from './password-resets';
import probeRoutes from './probes';
import publicKeyRoutes from './public-keys';
import refreshTokenRoutes from './refresh-tokens';
import steamApiKeyRoutes from './steam-api-keys';
import userRoutes from './users';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(authorizationRequestRoutes);
  router.use(authorizationRoutes);
  router.use(loginRoutes);
  router.use(namespaceRoutes);
  router.use(passwordResetRoutes);
  router.use(probeRoutes);
  router.use(publicKeyRoutes);
  router.use(refreshTokenRoutes);
  router.use(steamApiKeyRoutes);
  router.use(userRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
