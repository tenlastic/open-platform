import { RefreshTokenDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const RefreshTokenEvent = new EventEmitter<DatabasePayload<RefreshTokenDocument>>();