import { GroupDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const GroupEvent = new EventEmitter<DatabasePayload<GroupDocument>>();