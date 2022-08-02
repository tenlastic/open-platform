import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as downloadHandler } from './download';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';
import { handler as uploadHandler } from './upload';

export const router = new Router({ prefix: '/storefronts' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.get('/:storefrontId/:field', downloadHandler);
router.get('/:storefrontId/:field/:_id', downloadHandler);
router.post('/', createHandler);
router.post('/:_id/:field', uploadHandler);
router.put('/:_id', updateHandler);
