import { IgnorationPermissions } from '../../../mongodb';
import { count } from '@tenlastic/web-server';

export const handler = count(IgnorationPermissions);
