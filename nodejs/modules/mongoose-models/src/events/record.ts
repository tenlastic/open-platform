import { EventEmitter, IDatabasePayload } from '../change-stream';
import { RecordDocument } from '../models';

export const RecordEvent = new EventEmitter<IDatabasePayload<RecordDocument>>();
