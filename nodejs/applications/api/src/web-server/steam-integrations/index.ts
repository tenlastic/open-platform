import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as loginsHandler } from './logins';
import { handler as updateHandler } from './update';

const router = new Router();

router.delete('/namespaces/:namespaceId/steam-integrations/:_id', deleteHandler);
router.get('/namespaces/:namespaceId/steam-integrations', findHandler);
router.get('/namespaces/:namespaceId/steam-integrations/count', countHandler);
router.get('/namespaces/:namespaceId/steam-integrations/:_id', findOneHandler);
router.patch('/namespaces/:namespaceId/steam-integrations/:_id', updateHandler);
router.post('/namespaces/:namespaceId/steam-integrations', createHandler);
router.post('/namespaces/:namespaceId/steam-integrations/:_id/logins', loginsHandler);

export default router.routes();
