import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { GroupInvitationDocument } from './model';

export const OnGroupInvitationConsumed = new EventEmitter<
  IDatabasePayload<GroupInvitationDocument>
>();
