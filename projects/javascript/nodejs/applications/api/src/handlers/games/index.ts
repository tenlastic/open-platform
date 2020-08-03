import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as downloadHandler } from './download';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';
import { handler as uploadHandler } from './upload';

export const router = new Router({ prefix: '/games' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.get('/:_id/:field', downloadHandler);
router.get('/:_id/:field/:fileId', downloadHandler);
router.post('/', createHandler);
router.post('/:_id/upload', uploadHandler);
router.put('/:_id', updateHandler);
