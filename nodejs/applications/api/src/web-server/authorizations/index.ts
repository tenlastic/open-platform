import * as Router from 'koa-router';

import { handler as bannedAtHandler } from './banned-at';
import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';

const router = new Router();

router.delete('/authorizations/:_id', deleteHandler);
router.get('/authorizations', findHandler);
router.get('/authorizations/count', countHandler);
router.get('/authorizations/:_id', findOneHandler);
router.patch('/authorizations/:_id', updateHandler);
router.patch('/authorizations/:_id/banned-at', bannedAtHandler);
router.post('/authorizations', createHandler);

router.delete('/namespaces/:namespaceId/authorizations/:_id', deleteHandler);
router.get('/namespaces/:namespaceId/authorizations', findHandler);
router.get('/namespaces/:namespaceId/authorizations/count', countHandler);
router.get('/namespaces/:namespaceId/authorizations/:_id', findOneHandler);
router.patch('/namespaces/:namespaceId/authorizations/:_id', updateHandler);
router.patch('/namespaces/:namespaceId/authorizations/:_id/banned-at', bannedAtHandler);
router.post('/namespaces/:namespaceId/authorizations', createHandler);

export default router.routes();
