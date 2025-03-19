import { authenticationMiddleware } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as removeMemberHandler } from './remove-member';
import { handler as updateHandler } from './update';

const router = new Router();

router.delete('/namespaces/:namespaceId/groups/:_id', deleteHandler);
router.delete(
  '/namespaces/:namespaceId/groups/:groupId/members/:_id',
  authenticationMiddleware,
  removeMemberHandler,
);
router.get('/namespaces/:namespaceId/groups', findHandler);
router.get('/namespaces/:namespaceId/groups/count', countHandler);
router.get('/namespaces/:namespaceId/groups/:_id', findOneHandler);
router.patch('/namespaces/:namespaceId/groups/:_id', updateHandler);

export default router.routes();
