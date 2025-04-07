import { Router } from '@tenlastic/web-socket-server';

import { storageLimitMiddleware } from '../../middleware';
import { handler as createHandler } from './create';

const router = new Router({ prefix: '/queue-members' });

router.post('/', storageLimitMiddleware, createHandler);

export default router.routes();
