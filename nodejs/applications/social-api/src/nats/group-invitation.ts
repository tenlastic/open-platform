import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { GroupInvitationDocument } from '../mongodb';

export const GroupInvitationEvent = new EventEmitter<IDatabasePayload<GroupInvitationDocument>>();
