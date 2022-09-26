import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { UserDocument } from '../mongodb';

export const UserEvent = new EventEmitter<IDatabasePayload<UserDocument>>();
