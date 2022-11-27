import { EventEmitter, IDatabasePayload, RecordDocument } from '@tenlastic/mongoose';

export const RecordEvent = new EventEmitter<IDatabasePayload<RecordDocument>>();
