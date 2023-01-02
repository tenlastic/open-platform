import * as Router from 'koa-router';

import { handler as jwksHandler } from './jwks';

const router = new Router({ prefix: '/public-keys' });

router.get('/jwks', jwksHandler);

export default router.routes();
