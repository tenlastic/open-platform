import { CollectionPermissions } from '../../../../mongodb';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(CollectionPermissions);
