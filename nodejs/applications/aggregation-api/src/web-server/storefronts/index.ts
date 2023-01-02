import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

const router = new Router();

router.get('/storefronts', findHandler);
router.get('/storefronts/count', countHandler);
router.get('/storefronts/:_id', findOneHandler);

export default router.routes();
