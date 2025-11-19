import { QueueModel, QueuePermissionOptions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(QueueModel, QueuePermissionOptions);
