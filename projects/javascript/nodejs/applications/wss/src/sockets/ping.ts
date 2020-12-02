import { AuthenticationData, WebSocket } from '@tenlastic/web-server';

export async function ping(auth: AuthenticationData, data: any, ws: WebSocket) {
  ws.send(JSON.stringify({ _id: data._id }));
}
