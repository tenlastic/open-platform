import { GameServerPermissions } from '../../../../mongodb';
import { logs } from '@tenlastic/web-server';

export const handler = logs(GameServerPermissions);
