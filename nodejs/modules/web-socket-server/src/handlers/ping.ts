import { AuthenticationData, WebSocket } from '../web-socket-server';

export async function ping(auth: AuthenticationData, data: any, ws: WebSocket) {
  ws.send(JSON.stringify({ _id: data._id }));
}
