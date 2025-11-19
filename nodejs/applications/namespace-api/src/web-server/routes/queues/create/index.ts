import { QueueModel, QueuePermissionOptions } from '@tenlastic/mongoose';
import { create } from '@tenlastic/web-server';

export const handler = create(QueueModel, QueuePermissionOptions);
