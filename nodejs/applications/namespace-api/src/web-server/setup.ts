import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import articlesRoutes from './articles';
import buildsRoutes from './builds';
import collectionsRoutes from './collections';
import gameServersRoutes from './game-servers';
import probesRoutes from './probes';
import queuesRoutes from './queues';
import queueMembersRoutes from './queue-members';
import recordsRoutes from './records';
import storefrontsRoutes from './storefronts';
import webSocketsRoutes from './web-sockets';
import workflowsRoutes from './workflows';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(articlesRoutes);
  router.use(buildsRoutes);
  router.use(collectionsRoutes);
  router.use(gameServersRoutes);
  router.use(probesRoutes);
  router.use(queuesRoutes);
  router.use(queueMembersRoutes);
  router.use(recordsRoutes);
  router.use(storefrontsRoutes);
  router.use(webSocketsRoutes);
  router.use(workflowsRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
