import { MatchModel, MatchPermissionOptions } from '@tenlastic/mongoose';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(MatchModel, MatchPermissionOptions);
