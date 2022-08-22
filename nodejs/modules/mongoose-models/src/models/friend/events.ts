import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { FriendDocument } from './model';

export const OnFriendConsumed = new EventEmitter<IDatabasePayload<FriendDocument>>();
