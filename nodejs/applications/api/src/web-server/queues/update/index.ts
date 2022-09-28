import { QueuePermissions } from '../../../mongodb';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(QueuePermissions);
