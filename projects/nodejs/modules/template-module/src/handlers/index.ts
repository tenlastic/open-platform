import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';

export const router = new Router({ prefix: '/examples' });

router.delete('/:id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:id', findOneHandler);
router.post('/', createHandler);
