import { WebSocketModel, WebSocketPermissionOptions } from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { State, StatusCode, WebSocket as WS } from '@tenlastic/web-socket-server';

export async function connection(podName: string, state: State, ws: WS) {
  if (!state.jwt?.user) {
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

  state.webSocket = {
    _id: webSocket._id.toHexString(),
    namespaceId: webSocket.namespaceId.toHexString(),
  };

  const context = {
    credentials: { ...state },
    Model: WebSocketModel,
    options: WebSocketPermissionOptions,
  };
  const fullDocument = await permissions.read(context, webSocket);
  ws.send({ body: { fullDocument, operationType: 'insert' }, status: StatusCode.OK });

  // Update Web Socket in MongoDB when disconnected.
  ws.on('close', async () => await WebSocketModel.disconnect(webSocket._id));
  ws.on('error', async () => await WebSocketModel.disconnect(webSocket._id));
}
