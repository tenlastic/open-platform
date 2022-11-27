import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { GroupInvitationDocument } from '../mongodb';

export const GroupInvitationEvent = new EventEmitter<IDatabasePayload<GroupInvitationDocument>>();
