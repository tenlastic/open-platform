import { QueuePermissions } from '@tenlastic/mongoose';
import { updateOneDate } from '@tenlastic/web-server';

export const handler = updateOneDate('restartedAt', QueuePermissions);
