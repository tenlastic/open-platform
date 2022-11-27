import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { RefreshTokenDocument } from '../mongodb';

export const RefreshTokenEvent = new EventEmitter<IDatabasePayload<RefreshTokenDocument>>();
