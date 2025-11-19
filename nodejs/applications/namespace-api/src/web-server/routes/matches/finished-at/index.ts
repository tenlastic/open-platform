import { MatchModel, MatchPermissionOptions } from '@tenlastic/mongoose';
import { updateOneDate } from '@tenlastic/web-server';

export const handler = updateOneDate('finishedAt', MatchModel, MatchPermissionOptions);
