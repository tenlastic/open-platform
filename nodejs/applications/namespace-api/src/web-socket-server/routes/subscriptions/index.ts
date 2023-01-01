import { Router } from '@tenlastic/web-socket-server';

import { handler as ackHandler } from './ack';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as logsHandler } from './logs';
import { handler as nakHandler } from './nak';

const router = new Router({ prefix: '/subscriptions' });

router.delete('/:_id', deleteHandler);
router.post('/:_id/acks', ackHandler);
router.post('/:_id/naks', nakHandler);
router.post('/:collection', createHandler);
router.post('/:collection/:_id/logs/:pod/:container', logsHandler);
router.post('/collections/:collectionId/records', createHandler);

export default router.routes();
