import { EventEmitter, IDatabasePayload } from '../change-stream';
import { RefreshTokenDocument } from '../models';

export const RefreshTokenEvent = new EventEmitter<IDatabasePayload<RefreshTokenDocument>>();
