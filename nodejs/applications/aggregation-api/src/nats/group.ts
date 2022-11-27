import { EventEmitter, GroupDocument, IDatabasePayload } from '@tenlastic/mongoose';

export const GroupEvent = new EventEmitter<IDatabasePayload<GroupDocument>>();
