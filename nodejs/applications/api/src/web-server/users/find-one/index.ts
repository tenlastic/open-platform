import { UserModel, UserPermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(UserModel, UserPermissionOptions);
