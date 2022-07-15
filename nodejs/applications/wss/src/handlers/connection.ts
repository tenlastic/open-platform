import {
  Authorization,
  WebSocket,
  WebSocketDocument,
  WebSocketPermissions,
} from '@tenlastic/mongoose-models';
import { AuthenticationData, WebSocket as WS } from '@tenlastic/web-socket-server';

const podName = process.env.POD_NAME;

export async function connection(auth: AuthenticationData, ws: WS) {
  if (!auth.jwt || !auth.jwt.jti || !auth.jwt.user) {
    return;
  }

  // Add the WebSocket to MongoDB.
  const webSocket = await WebSocket.create({ nodeId: podName, userId: auth.jwt.user._id });

  // Send the web socket ID to the client.
  const authorization = await Authorization.findOne({
    namespaceId: { $exists: false },
    userId: auth.jwt.user._id,
  });
  const credentials = { apiKey: auth.key, authorization, user: auth.jwt.user };
  const response = await WebSocketPermissions.read(credentials, webSocket);
  ws.send(JSON.stringify({ fullDocument: response, operationType: 'insert' }));

  // Update the WebSocket's disconnectedAt timestamp in MongoDB.
  ws.on('close', async () => await disconnect(webSocket));
  ws.on('error', async () => await disconnect(webSocket));
}

async function disconnect(webSocket: WebSocketDocument) {
  webSocket.disconnectedAt = new Date();
  return webSocket.save();
}
