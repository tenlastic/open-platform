import { EventEmitter, IDatabasePayload } from '../change-stream';
import { UserDocument } from '../models';

export const UserEvent = new EventEmitter<IDatabasePayload<UserDocument>>();
