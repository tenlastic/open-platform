import { MatchInvitationDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const MatchInvitationEvent = new EventEmitter<DatabasePayload<MatchInvitationDocument>>();
