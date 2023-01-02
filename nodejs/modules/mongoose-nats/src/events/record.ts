import { RecordDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const RecordEvent = new EventEmitter<DatabasePayload<RecordDocument>>();
