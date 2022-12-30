import { Router } from '@tenlastic/web-socket-server';

import { handler as livenessHandler } from './liveness';
import { handler as readinessHandler } from './readiness';

const router = new Router({ prefix: '/probes' });

router.get('/liveness', livenessHandler);
router.get('/readiness', readinessHandler);

export default router.routes();
