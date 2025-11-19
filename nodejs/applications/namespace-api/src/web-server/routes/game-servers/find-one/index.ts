import { GameServerModel, GameServerPermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(GameServerModel, GameServerPermissionOptions);
