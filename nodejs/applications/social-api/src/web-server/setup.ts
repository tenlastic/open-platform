import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import friendsRoutes from './friends';
import groupsRoutes from './groups';
import groupInvitationsRoutes from './group-invitations';
import ignorationsRoutes from './ignorations';
import messagesRoutes from './messages';
import probesRoutes from './probes';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(friendsRoutes);
  router.use(groupsRoutes);
  router.use(groupInvitationsRoutes);
  router.use(ignorationsRoutes);
  router.use(messagesRoutes);
  router.use(probesRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
