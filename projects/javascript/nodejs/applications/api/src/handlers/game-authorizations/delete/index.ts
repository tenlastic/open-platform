import { GameAuthorizationPermissions } from '@tenlastic/mongoose-models';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(GameAuthorizationPermissions);
