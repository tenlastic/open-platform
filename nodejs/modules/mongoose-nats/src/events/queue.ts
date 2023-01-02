import { QueueDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const QueueEvent = new EventEmitter<DatabasePayload<QueueDocument>>();
