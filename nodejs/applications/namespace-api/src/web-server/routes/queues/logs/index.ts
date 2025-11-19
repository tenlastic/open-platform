import { QueueModel, QueuePermissionOptions } from '@tenlastic/mongoose';
import { findLogs } from '@tenlastic/web-server';

export const handler = findLogs(QueueModel, QueuePermissionOptions);
