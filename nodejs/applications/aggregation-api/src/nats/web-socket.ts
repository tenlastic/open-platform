import { WebSocketModel } from '@tenlastic/mongoose';
import { log, NamespaceEvent, UserEvent, WebSocketEvent } from '@tenlastic/mongoose-nats';

// Delete Web Sockets if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return WebSocketModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Web Sockets if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return WebSocketModel.deleteMany({ userId: payload.fullDocument._id });
  }
});

// Log the message.
WebSocketEvent.sync(log);
