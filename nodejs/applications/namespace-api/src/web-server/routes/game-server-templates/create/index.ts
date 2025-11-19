import { GameServerTemplateModel, GameServerTemplatePermissionOptions } from '@tenlastic/mongoose';
import { create } from '@tenlastic/web-server';

export const handler = create(GameServerTemplateModel, GameServerTemplatePermissionOptions);
