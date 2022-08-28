import { EventEmitter, IDatabasePayload } from '../change-stream';
import { GroupInvitationDocument } from '../models';

export const GroupInvitationEvent = new EventEmitter<IDatabasePayload<GroupInvitationDocument>>();
