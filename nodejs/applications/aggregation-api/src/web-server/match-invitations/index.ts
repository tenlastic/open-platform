import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

const router = new Router({ prefix: '/match-invitations' });

router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);

export default router.routes();
