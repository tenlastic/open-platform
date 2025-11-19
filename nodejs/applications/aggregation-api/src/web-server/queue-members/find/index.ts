import { QueueMemberModel, QueueMemberPermissionOptions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(QueueMemberModel, QueueMemberPermissionOptions);
