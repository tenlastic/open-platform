import { EventEmitter, GroupInvitationDocument, IDatabasePayload } from '@tenlastic/mongoose';

export const GroupInvitationEvent = new EventEmitter<IDatabasePayload<GroupInvitationDocument>>();
