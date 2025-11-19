import { GameServerTemplateModel, GameServerTemplatePermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(GameServerTemplateModel, GameServerTemplatePermissionOptions);
