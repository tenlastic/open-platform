import { NamespaceModel, NamespacePermissionOptions } from '@tenlastic/mongoose';
import { findLogs } from '@tenlastic/web-server';

export const handler = findLogs(NamespaceModel, NamespacePermissionOptions);
