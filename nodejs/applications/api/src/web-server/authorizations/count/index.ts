import { AuthorizationPermissions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(AuthorizationPermissions);
