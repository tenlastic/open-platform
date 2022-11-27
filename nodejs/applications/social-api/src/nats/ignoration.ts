import { EventEmitter, IDatabasePayload, IgnorationDocument } from '@tenlastic/mongoose';

export const IgnorationEvent = new EventEmitter<IDatabasePayload<IgnorationDocument>>();
