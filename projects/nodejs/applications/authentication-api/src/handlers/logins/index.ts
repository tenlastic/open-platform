import * as Router from 'koa-router';

import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as refreshTokenHandler } from './refresh-token';

export const router = new Router({ prefix: '/logins' });

router.delete('/', deleteHandler);
router.post('/', createHandler);
router.post('/refresh-token', refreshTokenHandler);
