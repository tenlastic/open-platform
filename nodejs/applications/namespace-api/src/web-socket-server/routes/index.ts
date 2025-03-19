import { Router } from '@tenlastic/web-socket-server';

import groupRoutes from './groups';
import probeRoutes from './probes';
import queueMemberRoutes from './queue-members';
import subscriptionRoutes from './subscriptions';

const router = new Router();

router.use(groupRoutes);
router.use(probeRoutes);
router.use(queueMemberRoutes);
router.use(subscriptionRoutes);

export default router.routes();
