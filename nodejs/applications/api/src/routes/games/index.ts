import * as Router from 'koa-router';

import { handler as countHandler } from './count';
import { handler as createHandler } from './create';
import { handler as deleteHandler } from './delete';
import { handler as downloadBackgroundHandler } from './background/download';
import { handler as downloadIconHandler } from './icon/download';
import { handler as downloadImagesHandler } from './images/download';
import { handler as downloadVideosHandler } from './videos/download';
import { handler as findHandler } from './find';
import { handler as findOneHandler } from './find-one';
import { handler as updateHandler } from './update';
import { handler as uploadBackgroundHandler } from './background/upload';
import { handler as uploadIconHandler } from './icon/upload';
import { handler as uploadImagesHandler } from './images/upload';
import { handler as uploadVideosHandler } from './videos/upload';

const router = new Router({ prefix: '/namespaces/:namespaceId/games' });

router.delete('/:_id', deleteHandler);
router.get('/', findHandler);
router.get('/count', countHandler);
router.get('/:_id', findOneHandler);
router.get('/:_id/background', downloadBackgroundHandler);
router.get('/:_id/icon', downloadIconHandler);
router.get('/:gameId/images/:_id', downloadImagesHandler);
router.get('/:gameId/videos/:_id', downloadVideosHandler);
router.post('/', createHandler);
router.post('/:_id/background', uploadBackgroundHandler);
router.post('/:_id/icon', uploadIconHandler);
router.post('/:_id/images', uploadImagesHandler);
router.post('/:_id/videos', uploadVideosHandler);
router.put('/:_id', updateHandler);

export default router.routes();
