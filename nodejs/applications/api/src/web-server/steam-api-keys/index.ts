import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';

const router = new Router();

router.delete('/namespaces/:namespaceId/steam-api-keys/:_id', deleteHandler);
router.get('/namespaces/:namespaceId/steam-api-keys', findHandler);
router.get('/namespaces/:namespaceId/steam-api-keys/count', countHandler);
router.get('/namespaces/:namespaceId/steam-api-keys/:_id', findOneHandler);
router.patch('/namespaces/:namespaceId/steam-api-keys/:_id', updateHandler);
router.post('/namespaces/:namespaceId/steam-api-keys', createHandler);

export default router.routes();
