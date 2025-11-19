import { MatchModel, MatchPermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(MatchModel, MatchPermissionOptions);
