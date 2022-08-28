import { EventEmitter, IDatabasePayload } from '../change-stream';
import { FriendDocument } from '../models';

export const FriendEvent = new EventEmitter<IDatabasePayload<FriendDocument>>();
