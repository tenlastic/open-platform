import { EventEmitter, IDatabasePayload } from '../change-stream';
import { IgnorationDocument } from '../models';

export const IgnorationEvent = new EventEmitter<IDatabasePayload<IgnorationDocument>>();
