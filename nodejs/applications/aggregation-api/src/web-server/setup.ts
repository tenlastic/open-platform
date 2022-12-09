import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import matchesRoutes from './matches';
import probesRoutes from './probes';
import queueMembersRoutes from './queue-members';
import storefrontsRoutes from './storefronts';
import webSocketsRoutes from './web-sockets';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(matchesRoutes);
  router.use(probesRoutes);
  router.use(queueMembersRoutes);
  router.use(storefrontsRoutes);
  router.use(webSocketsRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
