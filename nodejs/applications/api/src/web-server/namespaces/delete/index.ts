import { NamespacePermissions } from '../../../mongodb';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(NamespacePermissions);
