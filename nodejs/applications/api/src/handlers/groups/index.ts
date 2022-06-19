import { authenticationMiddleware } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as joinHandler } from './join';
import { handler as kickHandler } from './kick';
import { handler as leaveHandler } from './leave';
import { handler as updateHandler } from './update';

export const router = new Router({ prefix: '/groups' });

router.delete('/:_id', deleteHandler);
router.delete('/:_id/user-ids', authenticationMiddleware, leaveHandler);
router.delete('/:_id/user-ids/:userId', authenticationMiddleware, kickHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.post('/', authenticationMiddleware, createHandler);
router.post('/:_id/user-ids', authenticationMiddleware, joinHandler);
router.put('/:_id', updateHandler);
