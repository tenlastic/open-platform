import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { RefreshTokenDocument } from '../mongodb';

export const RefreshTokenEvent = new EventEmitter<IDatabasePayload<RefreshTokenDocument>>();
