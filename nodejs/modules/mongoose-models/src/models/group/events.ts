import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { GroupDocument } from './model';

export const OnGroupConsumed = new EventEmitter<IDatabasePayload<GroupDocument>>();

// Delete the group if empty.
OnGroupConsumed.async((payload) => {
  if (payload.operationType === 'delete') {
    return;
  }

  if (payload.fullDocument.userIds.length === 0) {
    return payload.fullDocument.remove();
  }
});
