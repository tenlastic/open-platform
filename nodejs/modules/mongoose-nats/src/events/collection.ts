import { CollectionDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const CollectionEvent = new EventEmitter<DatabasePayload<CollectionDocument>>();
