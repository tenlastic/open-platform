import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { PasswordResetDocument } from '../mongodb';

export const PasswordResetEvent = new EventEmitter<IDatabasePayload<PasswordResetDocument>>();
