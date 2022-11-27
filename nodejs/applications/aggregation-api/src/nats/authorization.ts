import { AuthorizationDocument, EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

export const AuthorizationEvent = new EventEmitter<IDatabasePayload<AuthorizationDocument>>();
