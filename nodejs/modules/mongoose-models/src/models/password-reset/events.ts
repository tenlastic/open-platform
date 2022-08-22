import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { PasswordResetDocument } from './model';

export const OnPasswordResetConsumed = new EventEmitter<IDatabasePayload<PasswordResetDocument>>();
