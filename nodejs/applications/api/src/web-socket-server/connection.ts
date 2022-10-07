import { ICredentials } from '@tenlastic/mongoose-permissions';
import { AuthenticationData, WebSocket as WS } from '@tenlastic/web-socket-server';

import {
  Authorization,
  AuthorizationDocument,
  WebSocket,
  WebSocketDocument,
  WebSocketPermissions,
} from '../mongodb';

const podName = process.env.POD_NAME;

export async function connection(auth: AuthenticationData, ws: WS) {
  if (!auth.jwt || !auth.jwt.jti || !auth.jwt.user) {
    ws.send(JSON.stringify({ _id: 0, status: 200 }));
    return;
  }

  // Add the WebSocket to MongoDB.
  const webSocket = await WebSocket.create({ nodeId: podName, userId: auth.jwt.user._id });

  // Send the web socket ID to the client.
  let authorization: AuthorizationDocument;
  if (auth.jwt?.authorization) {
    authorization = Authorization.hydrate(auth.jwt.authorization);
  } else if (auth.jwt?.user) {
    authorization = await Authorization.findOne({
      namespaceId: { $exists: false },
      userId: auth.jwt?.user?._id,
    });
  }
  const credentials: ICredentials = { apiKey: auth.apiKey, authorization, user: auth.jwt?.user };

  const response = await WebSocketPermissions.read(credentials, webSocket);
  ws.send(JSON.stringify({ _id: 0, fullDocument: response, operationType: 'insert', status: 200 }));

  // Update the WebSocket's disconnectedAt timestamp in MongoDB.
  ws.on('close', async () => await disconnect(webSocket));
  ws.on('error', async () => await disconnect(webSocket));
}

async function disconnect(webSocket: WebSocketDocument) {
  webSocket.disconnectedAt = new Date();
  return webSocket.save();
}
