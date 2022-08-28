import { EventEmitter, IDatabasePayload } from '../change-stream';
import { PasswordResetDocument } from '../models';

export const PasswordResetEvent = new EventEmitter<IDatabasePayload<PasswordResetDocument>>();
