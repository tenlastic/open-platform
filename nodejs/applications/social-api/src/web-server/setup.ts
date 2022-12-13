import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import friendRoutes from './friends';
import groupRoutes from './groups';
import groupInvitationRoutes from './group-invitations';
import ignorationRoutes from './ignorations';
import messageRoutes from './messages';
import probeRoutes from './probes';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(friendRoutes);
  router.use(groupRoutes);
  router.use(groupInvitationRoutes);
  router.use(ignorationRoutes);
  router.use(messageRoutes);
  router.use(probeRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
