import { EventEmitter, IDatabasePayload, UserDocument } from '@tenlastic/mongoose';

export const UserEvent = new EventEmitter<IDatabasePayload<UserDocument>>();
