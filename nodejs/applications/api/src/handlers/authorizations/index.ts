import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';

const rootRouter = new Router();
rootRouter.delete('/:_id', deleteHandler);
rootRouter.get('/', findHandler);
rootRouter.get('/count', countHandler);
rootRouter.get('/:_id', findOneHandler);
rootRouter.post('/', createHandler);
rootRouter.put('/:_id', updateHandler);

const namespaceRouter = new Router();
namespaceRouter.use('/', rootRouter.routes());

export const router = new Router();
router.use('/authorizations', rootRouter.routes());
router.use('/namespaceId/:namespaceId/', namespaceRouter.routes());
