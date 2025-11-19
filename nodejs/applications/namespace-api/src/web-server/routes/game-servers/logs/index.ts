import { GameServerModel, GameServerPermissionOptions } from '@tenlastic/mongoose';
import { findLogs } from '@tenlastic/web-server';

export const handler = findLogs(GameServerModel, GameServerPermissionOptions);
