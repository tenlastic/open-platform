import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { RecordDocument } from '../mongodb';

export const RecordEvent = new EventEmitter<IDatabasePayload<RecordDocument>>();
