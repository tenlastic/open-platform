import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import {
  articleRoutes,
  buildRoutes,
  collectionRoutes,
  gameServerRoutes,
  gameServerTemplateRoutes,
  matchRoutes,
  matchInvitationRoutes,
  probeRoutes,
  queueRoutes,
  queueMemberRoutes,
  recordRoutes,
  storefrontRoutes,
  webSocketRoutes,
  workflowRoutes,
} from './routes';

export function setup() {
  const webServer = new WebServer(loggingMiddleware);

  const router = new Router();
  router.use(articleRoutes);
  router.use(buildRoutes);
  router.use(collectionRoutes);
  router.use(gameServerRoutes);
  router.use(gameServerTemplateRoutes);
  router.use(matchRoutes);
  router.use(matchInvitationRoutes);
  router.use(probeRoutes);
  router.use(queueRoutes);
  router.use(queueMemberRoutes);
  router.use(recordRoutes);
  router.use(storefrontRoutes);
  router.use(webSocketRoutes);
  router.use(workflowRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
