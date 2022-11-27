import { NamespacePermissions } from '@tenlastic/mongoose';
import { logs } from '@tenlastic/web-server';

export const handler = logs(NamespacePermissions);
