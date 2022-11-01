import { authenticationMiddleware } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import { storageLimitMiddleware } from '../../middleware';
import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

const router = new Router({ prefix: '/namespaces/:namespaceId/queue-members' });

router.delete('/:_id', authenticationMiddleware, deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.post('/', authenticationMiddleware, storageLimitMiddleware, createHandler);

export default router.routes();
