import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import authorizationRequestsRoutes from './authorization-requests';
import authorizationsRoutes from './authorizations';
import loginsRoutes from './logins';
import namespacesRoutes from './namespaces';
import passwordResetsRoutes from './password-resets';
import probesRoutes from './probes';
import publicKeysRoutes from './public-keys';
import refreshTokensRoutes from './refresh-tokens';
import usersRoutes from './users';
import webSocketsRoutes from './web-sockets';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(authorizationRequestsRoutes);
  router.use(authorizationsRoutes);
  router.use(loginsRoutes);
  router.use(namespacesRoutes);
  router.use(passwordResetsRoutes);
  router.use(probesRoutes);
  router.use(publicKeysRoutes);
  router.use(refreshTokensRoutes);
  router.use(usersRoutes);
  router.use(webSocketsRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
