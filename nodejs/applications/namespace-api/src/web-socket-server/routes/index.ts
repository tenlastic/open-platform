import { ack, nak, ping, Router, unsubscribe } from '@tenlastic/web-socket-server';

import {
  articleHandler,
  buildLogHandler,
  buildHandler,
  collectionHandler,
  gameServerLogHandler,
  gameServerTemplateHandler,
  gameServerHandler,
  matchHandler,
  queueLogHandler,
  queueMemberHandler,
  queueHandler,
  recordHandler,
  storefrontHandler,
  webSocketHandler,
  workflowLogHandler,
  workflowHandler,
} from './subscribe';

const router = new Router();

router.delete('/subscriptions/:_id', unsubscribe);
router.get('/articles', articleHandler);
router.get('/builds', buildHandler);
router.get('/builds/:_id/logs/:pod/:container', buildLogHandler);
router.get('/collections', collectionHandler);
router.get('/game-server-templates', gameServerTemplateHandler);
router.get('/game-servers', gameServerHandler);
router.get('/game-servers/:_id/logs/:pod/:container', gameServerLogHandler);
router.get('/matches', matchHandler);
router.get('/queue-members', queueMemberHandler);
router.get('/queues', queueHandler);
router.get('/queues/:_id/logs/:pod/:container', queueLogHandler);
router.get('/collections/:collectionId/records', recordHandler);
router.get('/storefronts', storefrontHandler);
router.get('/web-sockets', webSocketHandler);
router.get('/workflows', workflowHandler);
router.get('/workflows/:_id/logs/:pod/:container', workflowLogHandler);
router.post('/pings', ping);
router.post('/subscriptions/:_id/acks', ack);
router.post('/subscriptions/:_id/naks', nak);

export default router.routes();
