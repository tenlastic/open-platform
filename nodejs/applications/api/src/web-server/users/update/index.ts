import { UserModel, UserPermissionOptions } from '@tenlastic/mongoose';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(UserModel, UserPermissionOptions);
