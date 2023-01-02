import { GroupPermissions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(GroupPermissions);
