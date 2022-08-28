import { EventEmitter, IDatabasePayload } from '../change-stream';
import { WebSocket, WebSocketDocument } from '../models';
import { UserEvent } from './user';

export const WebSocketEvent = new EventEmitter<IDatabasePayload<WebSocketDocument>>();

// Delete Web Sockets if associated User is deleted.
UserEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await WebSocket.find({ userId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
