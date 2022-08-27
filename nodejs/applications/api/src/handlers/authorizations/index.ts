import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';

export const router = new Router();

router.delete('/authorizations/:_id', deleteHandler);
router.get('/authorizations', findHandler);
router.get('/authorizations/count', countHandler);
router.get('/authorizations/:_id', findOneHandler);
router.post('/authorizations', createHandler);
router.put('/authorizations/:_id', updateHandler);

router.delete('/namespaces/:namespaceId/authorizations/:_id', deleteHandler);
router.get('/namespaces/:namespaceId/authorizations', findHandler);
router.get('/namespaces/:namespaceId/authorizations/count', countHandler);
router.get('/namespaces/:namespaceId/authorizations/:_id', findOneHandler);
router.post('/namespaces/:namespaceId/authorizations', createHandler);
router.put('/namespaces/:namespaceId/authorizations/:_id', updateHandler);
