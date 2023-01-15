import * as Router from 'koa-router';

import { storageLimitMiddleware } from '../../middleware';
import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as downloadHandler } from './download';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as logsHandler } from './logs';
import { handler as updateHandler } from './update';

const router = new Router({ prefix: '/namespaces/:namespaceId/builds' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.get('/:_id/files', downloadHandler);
router.get('/:_id/logs/:pod/:container', logsHandler);
router.patch('/:_id', storageLimitMiddleware, updateHandler);
router.post('/', storageLimitMiddleware, createHandler);

export default router.routes();
