import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { NamespaceDocument } from '../mongodb';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
