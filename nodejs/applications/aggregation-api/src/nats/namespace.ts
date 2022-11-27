import { EventEmitter, IDatabasePayload, NamespaceDocument } from '@tenlastic/mongoose';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
