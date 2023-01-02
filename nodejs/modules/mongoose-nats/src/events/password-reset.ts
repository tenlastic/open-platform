import { PasswordResetDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const PasswordResetEvent = new EventEmitter<DatabasePayload<PasswordResetDocument>>();
