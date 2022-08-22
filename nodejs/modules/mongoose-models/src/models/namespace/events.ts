import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { NamespaceDocument } from './model';

export const OnNamespaceConsumed = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
