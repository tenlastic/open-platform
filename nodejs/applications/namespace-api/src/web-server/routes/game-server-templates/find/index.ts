import { GameServerTemplatePermissions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(GameServerTemplatePermissions);
