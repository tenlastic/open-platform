import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { FriendDocument } from '../mongodb';

export const FriendEvent = new EventEmitter<IDatabasePayload<FriendDocument>>();
