import { EventEmitter, IDatabasePayload } from '../change-stream';
import { NamespaceDocument } from '../models';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
