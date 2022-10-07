import { QueuePermissions } from '../../../mongodb';
import { create } from '@tenlastic/web-server';

export const handler = create(QueuePermissions);
