import { Router } from '@tenlastic/web-socket-server';

import { storageLimitMiddleware } from '../../middleware';
import { handler as addMemberHandler } from './add-member';
import { handler as createHandler } from './create';

const router = new Router({ prefix: '/groups' });

router.post('/', storageLimitMiddleware, createHandler);
router.post('/:_id/members/', storageLimitMiddleware, addMemberHandler);

export default router.routes();
