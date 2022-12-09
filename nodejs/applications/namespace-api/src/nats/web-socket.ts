import { WebSocketModel } from '@tenlastic/mongoose';
import { UserEvent } from '@tenlastic/mongoose-nats';

// Delete Web Sockets if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return WebSocketModel.deleteMany({ userId: payload.fullDocument._id });
  }
});
