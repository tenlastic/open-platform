import { WebSocketModel, WebSocketPermissions } from '@tenlastic/mongoose';
import { ICredentials } from '@tenlastic/mongoose-permissions';
import { State, StatusCode, WebSocket as WS } from '@tenlastic/web-socket-server';

export async function connection(podName: string, state: State, ws: WS) {
  if (!state.jwt || !state.jwt.jti || !state.jwt.user) {
    ws.send({ status: StatusCode.OK });
    return;
  }

  // Add the WebSocket to MongoDB.
  const [namespaceId] = podName.match(/[0-9a-f]{24}/);
  const webSocket = await WebSocketModel.create({
    namespaceId,
    nodeId: podName,
    userId: state.jwt.user._id,
  });

  const credentials: ICredentials = { ...state };
  const fullDocument = await WebSocketPermissions.read(credentials, webSocket);
  ws.send({ body: { fullDocument, operationType: 'insert' }, status: StatusCode.OK });

  // Remove the Web Socket from MongoDB.
  ws.on('close', async () => await webSocket.remove());
  ws.on('error', async () => await webSocket.remove());
}
