import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as logsHandler } from './logs';

const router = new Router({ prefix: '/game-servers' });

router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.get('/:_id/logs/:pod/:container', logsHandler);

export default router.routes();
