import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';

const router = new Router();

router.delete('/authorization-requests/:_id', deleteHandler);
router.get('/authorization-requests', findHandler);
router.get('/authorization-requests/count', countHandler);
router.get('/authorization-requests/:_id', findOneHandler);
router.post('/authorization-requests', createHandler);
router.put('/authorization-requests/:_id', updateHandler);

router.delete('/namespaces/:namespaceId/authorization-requests/:_id', deleteHandler);
router.get('/namespaces/:namespaceId/authorization-requests', findHandler);
router.get('/namespaces/:namespaceId/authorization-requests/count', countHandler);
router.get('/namespaces/:namespaceId/authorization-requests/:_id', findOneHandler);
router.post('/namespaces/:namespaceId/authorization-requests', createHandler);
router.put('/namespaces/:namespaceId/authorization-requests/:_id', updateHandler);

export default router.routes();
