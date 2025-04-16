import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

const router = new Router({ prefix: '/namespaces/:namespaceId/queue-members' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);

export default router.routes();
