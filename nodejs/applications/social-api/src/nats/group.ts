import { GroupEvent, log } from '@tenlastic/mongoose-nats';

// Log the message.
GroupEvent.sync(log);

// Delete the group if empty.
GroupEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    return;
  }

  if (payload.fullDocument.userIds.length === 0) {
    return payload.fullDocument.remove();
  }
});
