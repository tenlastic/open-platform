import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { UserDocument } from './model';

export const OnUserConsumed = new EventEmitter<IDatabasePayload<UserDocument>>();
