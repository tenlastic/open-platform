import { UserModel, UserPermissionOptions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(UserModel, UserPermissionOptions);
