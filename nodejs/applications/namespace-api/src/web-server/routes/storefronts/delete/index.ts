import { StorefrontModel, StorefrontPermissionOptions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(StorefrontModel, StorefrontPermissionOptions);
