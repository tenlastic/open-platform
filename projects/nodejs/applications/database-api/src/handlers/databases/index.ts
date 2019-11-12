import { authenticationMiddleware } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';

export const router = new Router({ prefix: '/databases' });

router.use(authenticationMiddleware);

router.delete('/:name', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:name', findOneHandler);
router.post('/', createHandler);
router.put('/:name', updateHandler);
