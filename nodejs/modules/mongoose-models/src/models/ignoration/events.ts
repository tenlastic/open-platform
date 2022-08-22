import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { IgnorationDocument } from './model';

export const OnIgnorationConsumed = new EventEmitter<IDatabasePayload<IgnorationDocument>>();
