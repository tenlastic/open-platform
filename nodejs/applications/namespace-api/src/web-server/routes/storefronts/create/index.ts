import { StorefrontModel, StorefrontPermissionOptions } from '@tenlastic/mongoose';
import { create } from '@tenlastic/web-server';

export const handler = create(StorefrontModel, StorefrontPermissionOptions);
