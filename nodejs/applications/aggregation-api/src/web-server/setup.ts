import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import matchRoutes from './matches';
import matchInvitationRoutes from './match-invitations';
import probeRoutes from './probes';
import queueMemberRoutes from './queue-members';
import storefrontRoutes from './storefronts';
import webSocketRoutes from './web-sockets';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(matchRoutes);
  router.use(matchInvitationRoutes);
  router.use(probeRoutes);
  router.use(queueMemberRoutes);
  router.use(storefrontRoutes);
  router.use(webSocketRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
