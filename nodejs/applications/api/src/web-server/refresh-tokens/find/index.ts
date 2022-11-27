import { RefreshTokenPermissions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(RefreshTokenPermissions);
