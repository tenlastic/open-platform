import * as Router from 'koa-router';

import { handler as acceptedAtHandler } from './accepted-at';
import { handler as countHandler } from './count';
import { handler as declinedAtHandler } from './declined-at';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

const router = new Router({ prefix: '/namespaces/:namespaceId/match-invitations' });

router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.patch('/:_id/accepted-at', acceptedAtHandler);
router.patch('/:_id/declined-at', declinedAtHandler);

export default router.routes();
