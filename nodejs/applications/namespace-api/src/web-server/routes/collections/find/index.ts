import { CollectionModel, CollectionPermissionOptions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(CollectionModel, CollectionPermissionOptions);
