import { StorefrontDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const StorefrontEvent = new EventEmitter<DatabasePayload<StorefrontDocument>>();
