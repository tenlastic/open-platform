import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { IgnorationDocument } from '../mongodb';

export const IgnorationEvent = new EventEmitter<IDatabasePayload<IgnorationDocument>>();
