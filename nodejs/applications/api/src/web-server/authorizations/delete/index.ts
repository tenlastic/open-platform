import { AuthorizationModel, AuthorizationPermissionOptions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(AuthorizationModel, AuthorizationPermissionOptions);
