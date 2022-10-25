import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { GroupDocument } from '../mongodb';

export const GroupEvent = new EventEmitter<IDatabasePayload<GroupDocument>>();
