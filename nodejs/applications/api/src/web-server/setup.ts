import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import articlesRoutes from './articles';
import authorizationsRoutes from './authorizations';
import buildsRoutes from './builds';
import collectionsRoutes from './collections';
import friendsRoutes from './friends';
import gameServersRoutes from './game-servers';
import groupsRoutes from './groups';
import groupInvitationsRoutes from './group-invitations';
import ignorationsRoutes from './ignorations';
import loginsRoutes from './logins';
import messagesRoutes from './messages';
import namespacesRoutes from './namespaces';
import passwordResetsRoutes from './password-resets';
import publicKeysRoutes from './public-keys';
import queuesRoutes from './queues';
import queueMembersRoutes from './queue-members';
import recordsRoutes from './records';
import refreshTokensRoutes from './refresh-tokens';
import storefrontsRoutes from './storefronts';
import usersRoutes from './users';
import webSocketsRoutes from './web-sockets';
import workflowsRoutes from './workflows';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(articlesRoutes);
  router.use(authorizationsRoutes);
  router.use(buildsRoutes);
  router.use(collectionsRoutes);
  router.use(friendsRoutes);
  router.use(gameServersRoutes);
  router.use(groupsRoutes);
  router.use(groupInvitationsRoutes);
  router.use(ignorationsRoutes);
  router.use(loginsRoutes);
  router.use(messagesRoutes);
  router.use(namespacesRoutes);
  router.use(passwordResetsRoutes);
  router.use(publicKeysRoutes);
  router.use(queuesRoutes);
  router.use(queueMembersRoutes);
  router.use(recordsRoutes);
  router.use(refreshTokensRoutes);
  router.use(storefrontsRoutes);
  router.use(usersRoutes);
  router.use(webSocketsRoutes);
  router.use(workflowsRoutes);
  webServer.use(router.routes());

  webServer.serve('public', '/', 'index.html');
  webServer.start();

  return webServer;
}
