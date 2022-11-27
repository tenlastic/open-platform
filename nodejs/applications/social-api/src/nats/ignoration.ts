import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { IgnorationDocument } from '../mongodb';

export const IgnorationEvent = new EventEmitter<IDatabasePayload<IgnorationDocument>>();
