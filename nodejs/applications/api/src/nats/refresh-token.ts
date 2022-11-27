import { EventEmitter, IDatabasePayload, RefreshTokenDocument } from '@tenlastic/mongoose';

export const RefreshTokenEvent = new EventEmitter<IDatabasePayload<RefreshTokenDocument>>();
