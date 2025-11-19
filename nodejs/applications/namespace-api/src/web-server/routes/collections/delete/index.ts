import { CollectionModel, CollectionPermissionOptions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(CollectionModel, CollectionPermissionOptions);
