import { GameServerTemplateModel, GameServerTemplatePermissionOptions } from '@tenlastic/mongoose';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(GameServerTemplateModel, GameServerTemplatePermissionOptions);
