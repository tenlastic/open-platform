import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnUserConsumed } from '../user';
import { WebSocket, WebSocketDocument } from './model';

export const OnWebSocketConsumed = new EventEmitter<IDatabasePayload<WebSocketDocument>>();

// Delete Web Sockets if associated User is deleted.
OnUserConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await WebSocket.find({ userId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
