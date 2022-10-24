import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as logsHandler } from './logs';
import { handler as updateHandler } from './update';

const router = new Router({ prefix: '/namespaces/:namespaceId/queues' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.get('/:_id/logs/:pod/:container', logsHandler);
router.post('/', createHandler);
router.put('/:_id', updateHandler);

export default router.routes();
