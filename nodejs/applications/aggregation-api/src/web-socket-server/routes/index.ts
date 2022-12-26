import { ack, nak, ping, Router, unsubscribe } from '@tenlastic/web-socket-server';

import {
  authorizationRequestHandler,
  authorizationHandler,
  friendHandler,
  groupInvitationHandler,
  groupHandler,
  ignorationHandler,
  matchInvitationHandler,
  matchHandler,
  messageHandler,
  namespaceLogHandler,
  namespaceHandler,
  queueMemberHandler,
  storefrontHandler,
  userHandler,
  webSocketHandler,
} from './subscribe';

const router = new Router();

router.delete('/subscriptions/:_id', unsubscribe);
router.get('/authorization-requests', authorizationRequestHandler);
router.get('/authorizations', authorizationHandler);
router.get('/friends', friendHandler);
router.get('/group-invitations', groupInvitationHandler);
router.get('/groups', groupHandler);
router.get('/ignorations', ignorationHandler);
router.get('/match-invitations', matchInvitationHandler);
router.get('/matches', matchHandler);
router.get('/messages', messageHandler);
router.get('/namespaces', namespaceHandler);
router.get('/namespaces/:_id/logs/:pod/:container', namespaceLogHandler);
router.get('/queue-members', queueMemberHandler);
router.get('/storefronts', storefrontHandler);
router.get('/users', userHandler);
router.get('/web-sockets', webSocketHandler);
router.post('/pings', ping);
router.post('/subscriptions/:_id/acks', ack);
router.post('/subscriptions/:_id/naks', nak);

export default router.routes();
