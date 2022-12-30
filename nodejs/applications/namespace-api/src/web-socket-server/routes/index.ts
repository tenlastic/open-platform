import { Router } from '@tenlastic/web-socket-server';

import probeRoutes from './probes';
import subscriptionRoutes from './subscriptions';

const router = new Router();

router.use(probeRoutes);
router.use(subscriptionRoutes);

export default router.routes();
