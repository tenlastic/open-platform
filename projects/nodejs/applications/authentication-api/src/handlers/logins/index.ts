import { authenticationMiddleware } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';

export const router = new Router({ prefix: '/logins' });

router.delete('/', authenticationMiddleware, deleteHandler);
router.post('/', createHandler);
