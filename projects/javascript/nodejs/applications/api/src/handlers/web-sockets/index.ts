import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

export const router = new Router({ prefix: '/web-sockets' });

router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:id', findOneHandler);
