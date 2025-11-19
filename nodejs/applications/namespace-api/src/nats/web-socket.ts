import { WebSocketModel } from '@tenlastic/mongoose';
import { log, UserEvent, WebSocketEvent } from '@tenlastic/mongoose-nats';

// Delete Web Sockets if associated User is deleted.
UserEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await WebSocketModel.deleteMany({ userId: payload.fullDocument._id });
  }
});

// Log the message.
WebSocketEvent.sync(log);
