import {
  EventEmitter,
  IDatabasePayload,
  WebSocketDocument,
  WebSocketModel,
} from '@tenlastic/mongoose';

import { UserEvent } from './user';

export const WebSocketEvent = new EventEmitter<IDatabasePayload<WebSocketDocument>>();

// Delete Web Sockets if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return WebSocketModel.deleteMany({ userId: payload.fullDocument._id });
  }
});
