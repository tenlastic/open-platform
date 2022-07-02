import { GamePermissions } from '@tenlastic/mongoose-models';
import { create } from '@tenlastic/web-server';

export const handler = create(GamePermissions);
