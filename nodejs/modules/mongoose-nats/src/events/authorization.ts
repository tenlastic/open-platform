import { AuthorizationDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const AuthorizationEvent = new EventEmitter<DatabasePayload<AuthorizationDocument>>();
