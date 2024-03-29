import * as Router from 'koa-router';

import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';

const router = new Router({ prefix: '/password-resets' });

router.delete('/:hash', deleteHandler);
router.post('/', createHandler);

export default router.routes();