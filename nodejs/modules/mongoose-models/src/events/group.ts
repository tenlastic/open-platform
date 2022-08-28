import { EventEmitter, IDatabasePayload } from '../change-stream';
import { GroupDocument } from '../models';

export const GroupEvent = new EventEmitter<IDatabasePayload<GroupDocument>>();

// Delete the group if empty.
GroupEvent.async((payload) => {
  if (payload.operationType === 'delete') {
    return;
  }

  if (payload.fullDocument.userIds.length === 0) {
    return payload.fullDocument.remove();
  }
});
