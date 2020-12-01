import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as findHandler } from './find';

export const router = new Router({ prefix: '/game-servers/:gameServerId/logs' });

router.get('/', findHandler);
router.get('/count', countHandler);
router.post('/', createHandler);
