import * as Router from 'koa-router';

import { handler as livenessHandler } from './liveness';
import { handler as readinessHandler } from './readiness';

const router = new Router({ prefix: '/probes' });

router.get('/liveness', livenessHandler);
router.get('/readiness', readinessHandler);

export default router.routes();
