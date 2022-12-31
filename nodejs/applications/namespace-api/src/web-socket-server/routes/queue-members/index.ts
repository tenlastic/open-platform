import { Router } from '@tenlastic/web-socket-server';

import { handler as createHandler } from './create';

const router = new Router({ prefix: '/queue-members' });

router.post('/', createHandler);

export default router.routes();
