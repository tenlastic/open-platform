import { AuthenticationData, WebSocket } from '../web-socket-server';
import { consumers } from './subscribe';

export async function unsubscribe(auth: AuthenticationData, data: any, ws: WebSocket) {
  if (!consumers.has(ws) || !consumers.get(ws).has(data._id)) {
    return;
  }

  // Disconnect the Kafka consumer.
  const consumer = consumers.get(ws).get(data._id);
  consumer.disconnect();

  // Remove the Kafka consumer from memory.
  consumers.get(ws).delete(data._id);
}
