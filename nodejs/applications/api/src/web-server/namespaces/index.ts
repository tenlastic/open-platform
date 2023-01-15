import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as logsHandler } from './logs';
import { handler as restartedAtHandler } from './restarted-at';
import { handler as updateHandler } from './update';

const router = new Router({ prefix: '/namespaces' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.get('/:_id/logs/:pod/:container', logsHandler);
router.patch('/:_id', updateHandler);
router.patch('/:_id/restarted-at', restartedAtHandler);
router.post('/', createHandler);

export default router.routes();
