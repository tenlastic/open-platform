import { GameServerPermissions } from '@tenlastic/mongoose';
import { findLogs } from '@tenlastic/web-server';

export const handler = findLogs(GameServerPermissions);
