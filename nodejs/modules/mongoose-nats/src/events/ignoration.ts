import { IgnorationDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const IgnorationEvent = new EventEmitter<DatabasePayload<IgnorationDocument>>();