import { UserModel, UserPermissionOptions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(UserModel, UserPermissionOptions);
