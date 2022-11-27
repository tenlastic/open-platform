import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { GroupDocument } from '../mongodb';

export const GroupEvent = new EventEmitter<IDatabasePayload<GroupDocument>>();
