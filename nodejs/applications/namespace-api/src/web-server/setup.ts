import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import {
  articlesRoutes,
  buildsRoutes,
  collectionsRoutes,
  gameServersRoutes,
  matchesRoutes,
  probesRoutes,
  queuesRoutes,
  queueMembersRoutes,
  recordsRoutes,
  storefrontsRoutes,
  webSocketsRoutes,
  workflowsRoutes,
} from './routes';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(articlesRoutes);
  router.use(buildsRoutes);
  router.use(collectionsRoutes);
  router.use(gameServersRoutes);
  router.use(matchesRoutes);
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
