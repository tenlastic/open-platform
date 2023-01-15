import * as Router from 'koa-router';

import { storageLimitMiddleware } from '../../middleware';
import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as downloadHandler } from './download';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as pullHandler } from './pull';
import { handler as updateHandler } from './update';
import { handler as uploadHandler } from './upload';

const router = new Router();

router.delete('/namespaces/:namespaceId/storefronts/:_id', deleteHandler);
router.delete('/namespaces/:namespaceId/storefronts/:storefrontId/:field', pullHandler);
router.delete('/namespaces/:namespaceId/storefronts/:storefrontId/:field/:_id', pullHandler);
router.get('/namespaces/:namespaceId/storefronts', findHandler);
router.get('/namespaces/:namespaceId/storefronts/count', countHandler);
router.get('/namespaces/:namespaceId/storefronts/:_id', findOneHandler);
router.get('/namespaces/:namespaceId/storefronts/:storefrontId/:field', downloadHandler);
router.get('/namespaces/:namespaceId/storefronts/:storefrontId/:field/:_id', downloadHandler);
router.patch('/namespaces/:namespaceId/storefronts/:_id', storageLimitMiddleware, updateHandler);
router.post('/namespaces/:namespaceId/storefronts', storageLimitMiddleware, createHandler);
router.post(
  '/namespaces/:namespaceId/storefronts/:_id/:field',
  storageLimitMiddleware,
  uploadHandler,
);

export default router.routes();
