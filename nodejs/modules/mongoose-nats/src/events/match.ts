import { MatchDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const MatchEvent = new EventEmitter<DatabasePayload<MatchDocument>>();