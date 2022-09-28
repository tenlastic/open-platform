import { UserPermissions } from '../../../mongodb';
import { count } from '@tenlastic/web-server';

export const handler = count(UserPermissions);
