import * as Router from 'koa-router';

import { storageLimitMiddleware } from '../../middleware';
import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as logsHandler } from './logs';
import { handler as restartedAtHandler } from './restarted-at';
import { handler as updateHandler } from './update';

const router = new Router({ prefix: '/namespaces/:namespaceId/game-servers' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.get('/:_id/logs/:pod/:container', logsHandler);
router.patch('/:_id', storageLimitMiddleware, updateHandler);
router.patch('/:_id/restarted-at', restartedAtHandler);
router.post('/', storageLimitMiddleware, createHandler);

export default router.routes();
