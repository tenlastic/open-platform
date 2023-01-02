import { LoginDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const LoginEvent = new EventEmitter<DatabasePayload<LoginDocument>>();
