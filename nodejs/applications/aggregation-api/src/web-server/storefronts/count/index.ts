import { StorefrontModel, StorefrontPermissionOptions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(StorefrontModel, StorefrontPermissionOptions);
