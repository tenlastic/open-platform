import { EventEmitter, FriendDocument, IDatabasePayload } from '@tenlastic/mongoose';

export const FriendEvent = new EventEmitter<IDatabasePayload<FriendDocument>>();
