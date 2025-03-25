import { loggingMiddleware, WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import {
  articleRoutes,
  buildRoutes,
  collectionRoutes,
  gameServerRoutes,
  gameServerTemplateRoutes,
  groupInvitationRoutes,
  groupRoutes,
  matchRoutes,
  matchInvitationRoutes,
  probeRoutes,
  queueRoutes,
  queueMemberRoutes,
  recordRoutes,
  storefrontRoutes,
  teamRoutes,
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
  router.use(groupInvitationRoutes);
  router.use(groupRoutes);
  router.use(matchRoutes);
  router.use(matchInvitationRoutes);
  router.use(probeRoutes);
  router.use(queueRoutes);
  router.use(queueMemberRoutes);
  router.use(recordRoutes);
  router.use(storefrontRoutes);
  router.use(teamRoutes);
  router.use(webSocketRoutes);
  router.use(workflowRoutes);
  webServer.use(router.routes());

  webServer.start();

  return webServer;
}
