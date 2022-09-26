import { WebSocket } from '../web-socket-server';
import { subscriptions } from './subscribe';

export async function unsubscribe(data: any, ws: WebSocket) {
  if (!subscriptions.has(ws) || !subscriptions.get(ws).has(data._id)) {
    return;
  }

  // Disconnect the NATS subscription.
  const subscription = subscriptions.get(ws).get(data._id);
  subscription.unsubscribe();

  // Remove the NATS subscription from memory.
  subscriptions.get(ws).delete(data._id);
}
