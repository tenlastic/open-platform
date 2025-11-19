import { GameServerModel, GameServerPermissionOptions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(GameServerModel, GameServerPermissionOptions);
