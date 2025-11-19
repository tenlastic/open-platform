import { NamespaceModel, NamespacePermissionOptions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(NamespaceModel, NamespacePermissionOptions);
