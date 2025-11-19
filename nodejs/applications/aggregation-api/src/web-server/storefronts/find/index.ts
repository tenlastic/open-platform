import { StorefrontModel, StorefrontPermissionOptions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(StorefrontModel, StorefrontPermissionOptions);
