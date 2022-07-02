import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';

const router = new Router({ prefix: '/friends' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.post('/', createHandler);

export default router.routes();
