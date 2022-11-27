import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { FriendDocument } from '../mongodb';

export const FriendEvent = new EventEmitter<IDatabasePayload<FriendDocument>>();
