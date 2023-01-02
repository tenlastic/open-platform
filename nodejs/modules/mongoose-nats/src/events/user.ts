import { UserDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const UserEvent = new EventEmitter<DatabasePayload<UserDocument>>();