import { GroupPermissions } from '../../../mongodb';
import { count } from '@tenlastic/web-server';

export const handler = count(GroupPermissions);
