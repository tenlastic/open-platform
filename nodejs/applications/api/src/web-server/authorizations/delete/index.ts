import { AuthorizationPermissions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(AuthorizationPermissions);
