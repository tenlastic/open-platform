import { GroupPermissions } from '@tenlastic/mongoose-models';
import { count } from '@tenlastic/web-server';

export const handler = count(GroupPermissions);
