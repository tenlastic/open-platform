import { AuthorizationRequestDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const AuthorizationRequestEvent = new EventEmitter<
  DatabasePayload<AuthorizationRequestDocument>
>();
