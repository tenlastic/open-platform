import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import authorizationRequestsRoutes from './authorization-requests';
import authorizationsRoutes from './authorizations';
import friendsRoutes from './friends';
import groupsRoutes from './groups';
import groupInvitationsRoutes from './group-invitations';
import ignorationsRoutes from './ignorations';
import loginsRoutes from './logins';
import messagesRoutes from './messages';
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
  router.use(friendsRoutes);
  router.use(groupsRoutes);
  router.use(groupInvitationsRoutes);
  router.use(ignorationsRoutes);
  router.use(loginsRoutes);
  router.use(messagesRoutes);
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
