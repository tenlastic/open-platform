import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { AuthorizationDocument } from '../mongodb';

export const AuthorizationEvent = new EventEmitter<IDatabasePayload<AuthorizationDocument>>();
