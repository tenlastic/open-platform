import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { UserDocument } from '../mongodb';

export const UserEvent = new EventEmitter<IDatabasePayload<UserDocument>>();
