import * as Router from 'koa-router';

import { handler as jwtHandler } from './jwt';

export const router = new Router({ prefix: '/public-keys' });

router.get('/jwt', jwtHandler);
