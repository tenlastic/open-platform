import { authenticationMiddleware } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as readHandler } from './read';
import { handler as updateHandler } from './update';

const router = new Router({ prefix: '/messages' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.patch('/:_id', updateHandler);
router.post('/', createHandler);
router.post('/:_id/read-receipts', authenticationMiddleware, readHandler);

export default router.routes();
