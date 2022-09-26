import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as downloadHandler } from './download';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';
import { handler as uploadHandler } from './upload';

const router = new Router();

router.get('/storefronts', findHandler);
router.get('/storefronts/count', countHandler);
router.get('/storefronts/:_id', findOneHandler);

router.delete('/namespaces/:namespaceId/storefronts/:_id', deleteHandler);
router.get('/namespaces/:namespaceId/storefronts', findHandler);
router.get('/namespaces/:namespaceId/storefronts/count', countHandler);
router.get('/namespaces/:namespaceId/storefronts/:_id', findOneHandler);
router.get('/namespaces/:namespaceId/storefronts/:storefrontId/:field', downloadHandler);
router.get('/namespaces/:namespaceId/storefronts/:storefrontId/:field/:_id', downloadHandler);
router.post('/namespaces/:namespaceId/storefronts', createHandler);
router.post('/namespaces/:namespaceId/storefronts/:_id/:field', uploadHandler);
router.put('/namespaces/:namespaceId/storefronts/:_id', updateHandler);

export default router.routes();
