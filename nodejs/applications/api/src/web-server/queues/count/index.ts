import { QueuePermissions } from '../../../mongodb';
import { count } from '@tenlastic/web-server';

export const handler = count(QueuePermissions);
