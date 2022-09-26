import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { RecordDocument } from '../mongodb';

export const RecordEvent = new EventEmitter<IDatabasePayload<RecordDocument>>();
