import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

const router = new Router();

router.delete('/namespaces/:namespaceId/group-invitations/:_id', deleteHandler);
router.get('/namespaces/:namespaceId/group-invitations', findHandler);
router.get('/namespaces/:namespaceId/group-invitations/count', countHandler);
router.get('/namespaces/:namespaceId/group-invitations/:_id', findOneHandler);
router.post('/namespaces/:namespaceId/group-invitations', createHandler);

export default router.routes();
