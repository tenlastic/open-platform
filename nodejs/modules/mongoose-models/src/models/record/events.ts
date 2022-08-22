import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { RecordDocument } from './model';

export const OnRecordConsumed = new EventEmitter<IDatabasePayload<RecordDocument>>();
