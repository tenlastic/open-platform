import { GroupModel, GroupPermissionOptions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(GroupModel, GroupPermissionOptions);
