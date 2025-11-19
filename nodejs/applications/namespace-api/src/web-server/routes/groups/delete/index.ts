import { GroupModel, GroupPermissionOptions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(GroupModel, GroupPermissionOptions);
