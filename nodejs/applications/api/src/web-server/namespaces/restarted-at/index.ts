import { NamespaceModel, NamespacePermissionOptions } from '@tenlastic/mongoose';
import { updateOneDate } from '@tenlastic/web-server';

export const handler = updateOneDate('restartedAt', NamespaceModel, NamespacePermissionOptions);
