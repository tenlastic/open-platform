import * as Router from 'koa-router';

import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';

export const router = new Router({
  prefix: '/collections/:collectionId/indexes',
});

router.delete('/:id', deleteHandler);
router.post('/', createHandler);
