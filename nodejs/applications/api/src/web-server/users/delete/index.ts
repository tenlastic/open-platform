import { UserPermissions } from '../../../mongodb';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(UserPermissions);
