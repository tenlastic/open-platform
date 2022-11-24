import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import gameServersRoutes from './game-servers';
import probesRoutes from './probes';
import queueMembersRoutes from './queue-members';
import storefrontsRoutes from './storefronts';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(gameServersRoutes);
  router.use(probesRoutes);
  router.use(queueMembersRoutes);
  router.use(storefrontsRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
