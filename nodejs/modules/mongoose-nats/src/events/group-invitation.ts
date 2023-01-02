import { GroupInvitationDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const GroupInvitationEvent = new EventEmitter<DatabasePayload<GroupInvitationDocument>>();
