import { NamespaceModel, NamespacePermissionOptions } from '@tenlastic/mongoose';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(NamespaceModel, NamespacePermissionOptions);
