import * as Router from 'koa-router';

import { handler as acceptedAtHandler } from './accepted-at';
import { handler as countHandler } from './count';
import { handler as deleteOneHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateOneHandler } from './update';

const router = new Router({ prefix: '/namespaces/:namespaceId/match-invitations' });

router.delete('/:_id', deleteOneHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.put('/:_id', updateOneHandler);
router.put('/:_id/accepted-at', acceptedAtHandler);

export default router.routes();
