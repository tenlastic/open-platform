import { QueueModel, QueuePermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(QueueModel, QueuePermissionOptions);
