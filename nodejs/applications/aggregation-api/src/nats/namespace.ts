import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { NamespaceDocument } from '../mongodb';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
