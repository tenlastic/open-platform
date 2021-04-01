import { GameServerPermissions } from '@tenlastic/mongoose-models';
import { count } from '@tenlastic/web-server';

export const handler = count(GameServerPermissions);
