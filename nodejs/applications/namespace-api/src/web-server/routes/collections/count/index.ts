import { CollectionModel, CollectionPermissionOptions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(CollectionModel, CollectionPermissionOptions);
