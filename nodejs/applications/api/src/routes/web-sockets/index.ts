import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

const router = new Router();

router.get('/web-sockets', findHandler);
router.get('/web-sockets/count', countHandler);
router.get('/web-sockets/:_id', findOneHandler);
router.get('/namespaces/:namespaceId/web-sockets', findHandler);
router.get('/namespaces/:namespaceId/web-sockets/count', countHandler);
router.get('/namespaces/:namespaceId/web-sockets/:_id', findOneHandler);

export default router.routes();
