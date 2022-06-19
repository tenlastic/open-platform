import { WebSocket, WebSocketPermissions } from '@tenlastic/mongoose-models';
import { AuthenticationData, WebSocket as WS } from '@tenlastic/web-socket-server';

const podName = process.env.POD_NAME;

export async function connection(auth: AuthenticationData, ws: WS) {
  if (!auth.jwt || !auth.jwt.jti || !auth.jwt.user) {
    return;
  }

  // Add the WebSocket to MongoDB.
  const webSocket = await WebSocket.create({ nodeId: podName, userId: auth.jwt.user._id });

  // Send the web socket ID to the client.
  const response = await WebSocketPermissions.read(webSocket, auth.jwt.user);
  ws.send(JSON.stringify({ fullDocument: response, operationType: 'insert' }));

  // Delete the WebSocket from MongoDB on disconnect.
  ws.on('close', async () => await webSocket.remove());
  ws.on('error', async () => await webSocket.remove());
}
