import { QueueMemberDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const QueueMemberEvent = new EventEmitter<DatabasePayload<QueueMemberDocument>>();
