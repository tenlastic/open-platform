import { NamespacePermissions } from '../../../mongodb';
import { logs } from '@tenlastic/web-server';

export const handler = logs(NamespacePermissions);
