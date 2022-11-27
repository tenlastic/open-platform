import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { GroupDocument } from '../mongodb';

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
