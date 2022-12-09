import { FriendDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const FriendEvent = new EventEmitter<DatabasePayload<FriendDocument>>();