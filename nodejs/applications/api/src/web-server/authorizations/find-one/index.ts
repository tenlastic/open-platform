import { AuthorizationModel, AuthorizationPermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(AuthorizationModel, AuthorizationPermissionOptions);
