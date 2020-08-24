import { WebSocket } from '@tenlastic/web-server';

export async function ping(data: any, jwt: any, ws: WebSocket) {
  ws.send(JSON.stringify({ _id: data._id }));
}
