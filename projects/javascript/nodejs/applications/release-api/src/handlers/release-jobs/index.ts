import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';

export const router = new Router({ prefix: '/releases/:releaseId/jobs' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
