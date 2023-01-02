import { GroupEvent } from '@tenlastic/mongoose-nats';

// Delete the group if empty.
GroupEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return;
  }

  if (payload.fullDocument.userIds.length === 0) {
    return payload.fullDocument.remove();
  }
});
