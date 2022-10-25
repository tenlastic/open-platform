import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { AuthorizationDocument } from '../mongodb';

export const AuthorizationEvent = new EventEmitter<IDatabasePayload<AuthorizationDocument>>();
