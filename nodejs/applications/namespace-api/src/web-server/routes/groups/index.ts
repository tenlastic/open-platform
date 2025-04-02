import { authenticationMiddleware } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import { storageLimitMiddleware } from '../../middleware';
import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as joinHandler } from './join';
import { handler as leaveHandler } from './leave';
import { handler as updateHandler } from './update';

const router = new Router();

router.delete('/namespaces/:namespaceId/groups/:_id', deleteHandler);
router.delete(
  '/namespaces/:namespaceId/groups/:groupId/user-ids/:_id',
  authenticationMiddleware,
  leaveHandler,
);
router.get('/namespaces/:namespaceId/groups', findHandler);
router.get('/namespaces/:namespaceId/groups/count', countHandler);
router.get('/namespaces/:namespaceId/groups/:_id', findOneHandler);
router.patch('/namespaces/:namespaceId/groups/:_id', updateHandler);
router.post(
  '/namespaces/:namespaceId/groups',
  authenticationMiddleware,
  storageLimitMiddleware,
  createHandler,
);
router.post(
  '/namespaces/:namespaceId/groups/:_id/user-ids',
  authenticationMiddleware,
  storageLimitMiddleware,
  joinHandler,
);

export default router.routes();
