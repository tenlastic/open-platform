import { WebSocket } from '@tenlastic/mongoose-models';
import { AuthenticationData, WebSocket as WS } from '@tenlastic/web-socket-server';

export function connection(auth: AuthenticationData, ws: WS) {
  if (!auth.jwt || !auth.jwt.jti || !auth.jwt.user) {
    return;
  }

  // Periodically update the WebSocket's heartbeat within MongoDB.
  let interval: NodeJS.Timeout;
  interval = setInterval(async () => {
    await WebSocket.findOneAndUpdate({ refreshTokenId: auth.jwt.jti }, { heartbeatAt: new Date() });
  }, 10000);

  // Delete the WebSocket from MongoDB on disconnect.
  ws.on('close', async () => await WebSocket.findOneAndDelete({ refreshTokenId: auth.jwt.jti }));
  ws.on('close', () => clearInterval(interval));
  ws.on('error', async () => await WebSocket.findOneAndDelete({ refreshTokenId: auth.jwt.jti }));
  ws.on('error', () => clearInterval(interval));
}
